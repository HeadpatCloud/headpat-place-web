import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import {
	loadLeaflet,
	parseLatLng,
	pinIcon,
	tileLayer,
	ZONE_STYLE,
} from "./leaflet-shared";

export function EventLocationMap({
	method,
	coordinates,
	circleRadius,
}: {
	method: string;
	coordinates: string[];
	circleRadius: number | null;
}) {
	const { resolvedTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const containerRef = useRef<HTMLDivElement>(null);
	const LRef = useRef<typeof LType | null>(null);
	const mapRef = useRef<LType.Map | null>(null);
	const tileRef = useRef<LType.TileLayer | null>(null);
	const groupRef = useRef<LType.LayerGroup | null>(null);

	useEffect(() => {
		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!LRef.current) LRef.current = await loadLeaflet();
			const L = LRef.current;
			if (cancelled || !containerRef.current) return;

			if (!mapRef.current) {
				mapRef.current = L.map(containerRef.current, {
					center: [20, 0],
					zoom: 2,
					scrollWheelZoom: false,
				});
				groupRef.current = L.layerGroup().addTo(mapRef.current);
				setTimeout(() => mapRef.current?.invalidateSize(), 80);
			}
			const map = mapRef.current;

			if (tileRef.current) map.removeLayer(tileRef.current);
			tileRef.current = tileLayer(L, dark).addTo(map);
			tileRef.current.bringToBack();

			const group = groupRef.current;
			if (!group) return;
			group.clearLayers();
			const coords = coordinates
				.map(parseLatLng)
				.filter((c): c is [number, number] => c !== null);

			let center: LType.LatLng | null = null;
			let bounds: LType.LatLngBounds | null = null;
			if (method === "polygon" && coords.length >= 3) {
				const poly = L.polygon(coords, ZONE_STYLE).addTo(group);
				bounds = poly.getBounds();
				center = bounds.getCenter();
			} else if (method === "circle" && coords.length >= 1 && circleRadius) {
				const circ = L.circle(coords[0], {
					...ZONE_STYLE,
					radius: circleRadius,
				}).addTo(group);
				bounds = circ.getBounds();
				center = L.latLng(coords[0]);
			}
			if (center) L.marker(center, { icon: pinIcon(L) }).addTo(group);
			if (bounds?.isValid())
				map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
		})();
		return () => {
			cancelled = true;
		};
	}, [dark, method, coordinates, circleRadius]);

	return (
		<div className="h-64 overflow-hidden rounded-xl border border-border">
			<div ref={containerRef} className="h-full w-full" />
		</div>
	);
}
