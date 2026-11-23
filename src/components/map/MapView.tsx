import { useQuery } from "@tanstack/react-query";
import type * as LType from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useLiveLocations } from "@/components/contexts/PresenceProvider";
import { useSession } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";
import {
	ACCENT,
	addTiles,
	clusterIcon,
	loadLeaflet,
	loadMarkerCluster,
	localTimezone,
	PERSON_COLOR,
	parseLatLng,
	personIcon,
	pinIcon,
	timezoneToView,
} from "./leaflet-shared";
import { MapUnsupported, useMapUnsupported } from "./MapUnsupported";
import { NearbyPanel } from "./NearbyPanel";
import { useNearbyList, useNearbyStatus, useRefreshOwnCell } from "./nearby";

function escapeHtml(s: string): string {
	return s.replace(
		/[&<>"]/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
	);
}

const SHOW_NEARBY_KEY = "map.showNearby";

function readShowNearby(): boolean {
	try {
		return window.localStorage.getItem(SHOW_NEARBY_KEY) !== "0";
	} catch {
		return true;
	}
}

type MapEvent = {
	id: string;
	title: string;
	startsAt: string | Date;
	locationZoneMethod: string;
	coordinates: string[];
	circleRadius: number | null;
};

export function MapView() {
	const { resolvedTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const containerRef = useRef<HTMLDivElement>(null);
	const LRef = useRef<typeof LType | null>(null);
	const mapRef = useRef<LType.Map | null>(null);
	const tileRef = useRef<LType.Layer | null>(null);
	const groupRef = useRef<LType.LayerGroup | null>(null);
	const clusterRef = useRef<LType.MarkerClusterGroup | null>(null);
	const peopleRef = useRef<LType.LayerGroup | null>(null);
	const nearbyRef = useRef<LType.MarkerClusterGroup | null>(null);
	const nearbyCellsRef = useRef<LType.LayerGroup | null>(null);
	const fittedRef = useRef(false);
	const [mapReady, setMapReady] = useState(false);
	const unsupported = useMapUnsupported();
	// Resolved presigned avatar URLs keyed by fileId (fetched once per fileId).
	const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
	const requestedAvatars = useRef<Set<string>>(new Set());

	const { data: session } = useSession();
	const signedIn = !!session?.user;
	// stable per locale, unlike useTranslations, so it can sit in effect deps
	const { t, locale } = useI18n();
	const [showNearby, setShowNearby] = useState(true);
	useEffect(() => setShowNearby(readShowNearby()), []);
	const changeShowNearby = (v: boolean) => {
		setShowNearby(v);
		try {
			window.localStorage.setItem(SHOW_NEARBY_KEY, v ? "1" : "0");
		} catch {
			// per-browser convenience only
		}
	};
	const nearby = useNearbyList(signedIn && showNearby);
	const nearbyStatus = useNearbyStatus(signedIn);
	useRefreshOwnCell(nearbyStatus.data?.visible === true);
	const liveLocations = useLiveLocations();
	const events = useQuery(
		orpc.event.mapList.queryOptions({ input: undefined }),
	);
	// Users who share their location with the signed-in viewer (initial set;
	// positions then update live over the websocket).
	const shared = useQuery({
		...orpc.location.visibleLocations.queryOptions({ input: {} }),
		enabled: !!session?.user,
	});

	useEffect(() => {
		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);

	// Re-fit the map whenever its box changes (sidebar toggle, rotation, resize) —
	// otherwise Leaflet renders gray tiles, which bites most often on mobile.
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => mapRef.current?.invalidateSize());
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-render layers when data/theme change
	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!LRef.current) LRef.current = await loadLeaflet();
			const L = LRef.current;
			await loadMarkerCluster();
			if (cancelled || !containerRef.current) return;

			if (!mapRef.current) {
				mapRef.current = L.map(containerRef.current, {
					center: [25, 0],
					zoom: 2,
					minZoom: 2,
					// markercluster needs a finite maxZoom; the cluster group is added
					// before the tile layer, so the map must carry it (matches tiles).
					maxZoom: 20,
					// Stop the world repeating horizontally: hard-bound to a single
					// world and bounce back at the edges (tiles also get noWrap below).
					maxBounds: [
						[-85, -180],
						[85, 180],
					],
					maxBoundsViscosity: 1,
				});
				groupRef.current = L.layerGroup().addTo(mapRef.current);
				clusterRef.current = L.markerClusterGroup({
					showCoverageOnHover: false,
					maxClusterRadius: 60,
					iconCreateFunction: (cluster) =>
						clusterIcon(L, cluster.getChildCount()),
				}).addTo(mapRef.current);
				peopleRef.current = L.layerGroup().addTo(mapRef.current);
				nearbyCellsRef.current = L.layerGroup().addTo(mapRef.current);
				// Everyone in one grid cell shares a point, so they cluster and
				// spread out (spiderfy) when the cluster is opened.
				nearbyRef.current = L.markerClusterGroup({
					showCoverageOnHover: false,
					maxClusterRadius: 40,
					iconCreateFunction: (c) => clusterIcon(L, c.getChildCount()),
				}).addTo(mapRef.current);
				setTimeout(() => mapRef.current?.invalidateSize(), 80);
				// re-measure after a zoom so the map always repaints to fill its box
				mapRef.current.on("zoomend", () =>
					mapRef.current?.invalidateSize({ pan: false }),
				);
				setMapReady(true);
			}
			const map = mapRef.current;

			// tile layer follows the app theme
			if (tileRef.current) map.removeLayer(tileRef.current);
			tileRef.current = addTiles(L, map, dark);

			// event zones + pins (pins cluster when they overlap at low zoom)
			const group = groupRef.current;
			const cluster = clusterRef.current;
			if (!group || !cluster) return;
			group.clearLayers();
			cluster.clearLayers();
			const bounds = L.latLngBounds([]);
			for (const ev of (events.data ?? []) as MapEvent[]) {
				const coords = (ev.coordinates ?? [])
					.map(parseLatLng)
					.filter((c): c is [number, number] => c !== null);
				const popup = `<div style="min-width:150px"><strong>${escapeHtml(
					ev.title,
				)}</strong><br><span style="opacity:.65;font-size:12px">${new Date(
					ev.startsAt,
				).toLocaleString()}</span><br><a href="/events/${ev.id}" style="color:${ACCENT}">View event →</a></div>`;
				let center: LType.LatLng | null = null;
				if (ev.locationZoneMethod === "polygon" && coords.length >= 3) {
					const poly = L.polygon(coords, {
						color: ACCENT,
						weight: 2,
						fillColor: ACCENT,
						fillOpacity: 0.25,
					})
						.addTo(group)
						.bindPopup(popup);
					center = poly.getBounds().getCenter();
					bounds.extend(poly.getBounds());
				} else if (
					ev.locationZoneMethod === "circle" &&
					coords.length >= 1 &&
					ev.circleRadius
				) {
					const circ = L.circle(coords[0], {
						radius: ev.circleRadius,
						color: ACCENT,
						weight: 2,
						fillColor: ACCENT,
						fillOpacity: 0.2,
					})
						.addTo(group)
						.bindPopup(popup);
					center = L.latLng(coords[0]);
					bounds.extend(circ.getBounds());
				}
				if (center) {
					cluster.addLayer(
						L.marker(center, { icon: pinIcon(L) }).bindPopup(popup),
					);
				}
			}
			if (!fittedRef.current) {
				if (bounds.isValid()) {
					map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
					fittedRef.current = true;
				} else if (events.isSuccess) {
					// no located events — open near the visitor's region instead of mid-ocean
					const view = timezoneToView(localTimezone());
					if (view) map.setView(view.center, view.zoom);
					fittedRef.current = true;
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [dark, events.data]);

	// Resolve a presigned URL for each sharer's avatar once. Long expiry so it
	// survives a long-open map; falls back to the initial when absent/failed.
	useEffect(() => {
		const ids = [
			...new Set(
				[...(shared.data ?? []), ...(nearby.data ?? [])]
					.map((p) => p.avatarFileId)
					.filter((x): x is string => !!x),
			),
		].filter((id) => !requestedAvatars.current.has(id));
		if (ids.length === 0) return;
		for (const id of ids) requestedAvatars.current.add(id);
		let cancelled = false;
		Promise.all(
			ids.map(async (fileId) => {
				try {
					const r = await client.storage.url({
						kind: "avatar",
						fileId,
						expirySec: 3600,
					});
					return [fileId, r.url] as const;
				} catch {
					return null;
				}
			}),
		).then((pairs) => {
			if (cancelled) return;
			const add: Record<string, string> = {};
			for (const p of pairs) if (p) add[p[0]] = p[1];
			if (Object.keys(add).length)
				setAvatarUrls((prev) => ({ ...prev, ...add }));
		});
		return () => {
			cancelled = true;
		};
	}, [shared.data, nearby.data]);

	// Shared-user markers: merge the initial visibleLocations set with live
	// websocket deltas (null delta = the share ended). Own layer so frequent
	// position updates don't rebuild the event zones.
	useEffect(() => {
		const L = LRef.current;
		const group = peopleRef.current;
		if (!mapReady || !L || !group) return;
		group.clearLayers();
		for (const p of shared.data ?? []) {
			const live = liveLocations[p.userId];
			if (live === null) continue; // share ended
			const lat = live ? live.lat : p.lat;
			const lng = live ? live.lng : p.lng;
			const label = p.displayName || p.name || "?";
			const approx = p.precision === "approximate";
			const status = p.statusText
				? `<br><span style="opacity:.7;font-size:12px">${escapeHtml(p.statusText)}</span>`
				: "";
			const approxNote = approx
				? `<br><span style="opacity:.55;font-size:11px">Approximate location</span>`
				: "";
			const link = p.profileUrl
				? `<br><a href="/user/${encodeURIComponent(p.profileUrl)}" style="color:${PERSON_COLOR}">View profile →</a>`
				: "";
			const popup = `<div style="min-width:150px"><strong>${escapeHtml(label)}</strong>${status}${approxNote}${link}</div>`;
			if (approx) {
				L.circle([lat, lng], {
					radius: 1500,
					color: PERSON_COLOR,
					weight: 1,
					fillColor: PERSON_COLOR,
					fillOpacity: 0.15,
				}).addTo(group);
			}
			const avatarUrl = p.avatarFileId ? avatarUrls[p.avatarFileId] : undefined;
			L.marker([lat, lng], { icon: personIcon(L, label, avatarUrl) })
				.addTo(group)
				.bindPopup(popup);
		}
	}, [mapReady, shared.data, liveLocations, avatarUrls]);

	// Who's around: people at their fuzzed grid cell, never an exact position.
	// The faint circle shows the cell so nobody reads the pin as precise.
	useEffect(() => {
		const L = LRef.current;
		const cluster = nearbyRef.current;
		const cells = nearbyCellsRef.current;
		if (!mapReady || !L || !cluster || !cells) return;
		cluster.clearLayers();
		cells.clearLayers();
		if (!showNearby) return;
		// someone you already see through a direct share keeps that marker
		const sharedIds = new Set((shared.data ?? []).map((p) => p.userId));
		const drawn = new Set<string>();
		for (const p of nearby.data ?? []) {
			if (sharedIds.has(p.userId)) continue;
			const cellKey = `${p.lat},${p.lng}`;
			if (!drawn.has(cellKey)) {
				drawn.add(cellKey);
				L.circle([p.lat, p.lng], {
					radius: (p.cellKm * 1000) / 2,
					color: PERSON_COLOR,
					weight: 1,
					dashArray: "4 4",
					fillColor: PERSON_COLOR,
					fillOpacity: 0.08,
					interactive: false,
				}).addTo(cells);
			}
			const label = p.displayName || p.name || "?";
			const where = p.eventTitle
				? `<br><span style="opacity:.7;font-size:12px">${escapeHtml(t("nearby.atEvent", { event: p.eventTitle }))}</span>`
				: "";
			const link = p.profileUrl
				? `<br><a href="/user/${encodeURIComponent(p.profileUrl)}" style="color:${PERSON_COLOR}">${escapeHtml(t("nearby.viewProfile"))}</a>`
				: "";
			const popup = `<div style="min-width:150px"><strong>${escapeHtml(label)}</strong>${where}<br><span style="opacity:.55;font-size:11px">${escapeHtml(
				t("nearby.aroundHere", { km: p.cellKm }),
			)}<br>${escapeHtml(
				t("nearby.updated", {
					time: new Date(p.updatedAt).toLocaleTimeString(locale, {
						hour: "2-digit",
						minute: "2-digit",
					}),
				}),
			)}</span>${link}</div>`;
			const avatarUrl = p.avatarFileId ? avatarUrls[p.avatarFileId] : undefined;
			cluster.addLayer(
				L.marker([p.lat, p.lng], {
					icon: personIcon(L, label, avatarUrl),
				}).bindPopup(popup),
			);
		}
	}, [mapReady, showNearby, nearby.data, shared.data, avatarUrls, locale, t]);

	return (
		<div className="relative h-full w-full">
			<div ref={containerRef} className="h-full w-full" />
			{signedIn && !unsupported ? (
				<div className="absolute top-3 right-3 z-[500]">
					<NearbyPanel
						showLayer={showNearby}
						onShowLayerChange={changeShowNearby}
					/>
				</div>
			) : null}
			{unsupported ? <MapUnsupported /> : null}
			{!unsupported && events.isSuccess && (events.data ?? []).length === 0 ? (
				<div className="pointer-events-none absolute inset-x-0 bottom-6 z-[500] flex justify-center">
					<div className="rounded-full border border-border bg-background/90 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
						No upcoming events have a location yet.
					</div>
				</div>
			) : null}
		</div>
	);
}
