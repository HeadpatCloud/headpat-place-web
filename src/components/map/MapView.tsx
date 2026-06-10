import { useQuery } from "@tanstack/react-query";
import type * as LType from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { orpc } from "@/lib/orpc";

const TILES = {
	light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
	dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const ATTRIBUTION =
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ACCENT = "#10b981";

function parseLatLng(s: string): [number, number] | null {
	const [lat, lng] = s.split(",").map(Number);
	return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}
function escapeHtml(s: string): string {
	return s.replace(
		/[&<>"]/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
	);
}
function pinIcon(L: typeof LType) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${ACCENT}" stroke="#fff" stroke-width="2"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>`;
	return L.divIcon({
		html: svg,
		className: "",
		iconSize: [26, 34],
		iconAnchor: [13, 34],
		popupAnchor: [0, -30],
	});
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
			if (!LRef.current) LRef.current = (await import("leaflet")).default;
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
			tileRef.current = L.tileLayer(dark ? TILES.dark : TILES.light, {
				attribution: ATTRIBUTION,
				subdomains: "abcd",
				maxZoom: 20,
			}).addTo(map);
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
			if (!fittedRef.current && bounds.isValid()) {
				map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
				fittedRef.current = true;
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
