import { useQuery } from "@tanstack/react-query";
import type * as LType from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { orpc } from "@/lib/orpc";
import {
	ACCENT,
	loadLeaflet,
	localTimezone,
	parseLatLng,
	pinIcon,
	tileLayer,
	timezoneToView,
} from "./leaflet-shared";

function escapeHtml(s: string): string {
	return s.replace(
		/[&<>"]/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
	);
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
	const tileRef = useRef<LType.TileLayer | null>(null);
	const groupRef = useRef<LType.LayerGroup | null>(null);
	const fittedRef = useRef(false);

	const events = useQuery(
		orpc.event.mapList.queryOptions({ input: undefined }),
	);

	useEffect(() => {
		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-render layers when data/theme change
	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!LRef.current) LRef.current = await loadLeaflet();
			const L = LRef.current;
			if (cancelled || !containerRef.current) return;

			if (!mapRef.current) {
				mapRef.current = L.map(containerRef.current, {
					center: [25, 0],
					zoom: 2,
					worldCopyJump: true,
				});
				groupRef.current = L.layerGroup().addTo(mapRef.current);
				setTimeout(() => mapRef.current?.invalidateSize(), 80);
			}
			const map = mapRef.current;

			// tile layer follows the app theme
			if (tileRef.current) map.removeLayer(tileRef.current);
			tileRef.current = tileLayer(L, dark).addTo(map);
			tileRef.current.bringToBack();

			// event zones + pins
			const group = groupRef.current;
			if (!group) return;
			group.clearLayers();
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
					L.marker(center, { icon: pinIcon(L) })
						.addTo(group)
						.bindPopup(popup);
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

	return (
		<div className="relative h-full w-full">
			<div ref={containerRef} className="h-full w-full" />
			{events.isSuccess && (events.data ?? []).length === 0 ? (
				<div className="pointer-events-none absolute inset-x-0 bottom-6 z-[500] flex justify-center">
					<div className="rounded-full border border-border bg-background/90 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
						No upcoming events have a location yet.
					</div>
				</div>
			) : null}
		</div>
	);
}
