/// <reference types="@geoman-io/leaflet-geoman-free" />
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import type * as LType from "leaflet";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	loadGeoman,
	loadLeaflet,
	localTimezone,
	parseLatLng,
	tileLayer,
	timezoneToView,
	ZONE_STYLE,
} from "./leaflet-shared";

export type LocationZoneMethod = "virtual" | "circle" | "polygon";

export type LocationValue = {
	method: LocationZoneMethod;
	coordinates: string[];
	circleRadius: number | null;
};

const METHODS: { id: LocationZoneMethod; label: string; hint: string }[] = [
	{ id: "virtual", label: "Online", hint: "No physical location." },
	{
		id: "circle",
		label: "Area (circle)",
		hint: "Drop a point, then drag the edge to size the circle.",
	},
	{
		id: "polygon",
		label: "Area (shape)",
		hint: "Click to drop corners, click the first point to close it.",
	},
];

const EDIT_EVENTS = ["pm:edit", "pm:update", "pm:dragend", "pm:markerdragend"];

export function LocationPicker({
	value,
	onChange,
}: {
	value: LocationValue;
	onChange: (v: LocationValue) => void;
}) {
	const { resolvedTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const method = value.method;

	const containerRef = useRef<HTMLDivElement>(null);
	const LRef = useRef<typeof LType | null>(null);
	const mapRef = useRef<LType.Map | null>(null);
	const tileRef = useRef<LType.TileLayer | null>(null);
	const layerRef = useRef<LType.Layer | null>(null);
	const valueRef = useRef(value);
	const onChangeRef = useRef(onChange);
	const darkRef = useRef(dark);
	valueRef.current = value;
	onChangeRef.current = onChange;
	darkRef.current = dark;

	const [search, setSearch] = useState("");
	const [searching, setSearching] = useState(false);
	const hasShape = value.coordinates.length > 0;

	useEffect(() => {
		if (method === "virtual") return;
		let cancelled = false;
		(async () => {
			const L = await loadLeaflet();
			await loadGeoman();
			if (cancelled || !containerRef.current) return;
			LRef.current = L;
			const map = L.map(containerRef.current, {
				center: [20, 0],
				zoom: 2,
				worldCopyJump: true,
			});
			mapRef.current = map;
			// darkRef (not the closure) so a theme that resolved/flipped during the
			// async import is honored, avoiding a light→dark tile flash
			tileRef.current = tileLayer(L, darkRef.current).addTo(map);
			tileRef.current.bringToBack();

			const capture = (layer: LType.Layer) => {
				if (method === "circle") {
					const c = (layer as LType.Circle).getLatLng();
					const r = Math.round((layer as LType.Circle).getRadius());
					onChangeRef.current({
						method,
						coordinates: [`${c.lat},${c.lng}`],
						circleRadius: r,
					});
				} else {
					const ring = (
						layer as LType.Polygon
					).getLatLngs()[0] as LType.LatLng[];
					onChangeRef.current({
						method,
						coordinates: ring.map((p) => `${p.lat},${p.lng}`),
						circleRadius: null,
					});
				}
			};
			const wireEdit = (layer: LType.Layer) => {
				for (const ev of EDIT_EVENTS) layer.on(ev, () => capture(layer));
			};
			const setLayer = (layer: LType.Layer) => {
				if (layerRef.current && layerRef.current !== layer) {
					map.removeLayer(layerRef.current);
				}
				layerRef.current = layer;
			};

			map.on("pm:create", (e) => {
				const layer = (e as unknown as { layer: LType.Circle | LType.Polygon })
					.layer;
				setLayer(layer);
				layer.pm.enable();
				capture(layer);
				wireEdit(layer);
				map.pm.disableDraw();
			});

			// seed an existing shape (edit mode)
			const seed = valueRef.current;
			let seeded = false;
			if (seed.method === method && seed.coordinates.length > 0) {
				if (method === "circle" && seed.circleRadius) {
					const c = parseLatLng(seed.coordinates[0]);
					if (c) {
						const layer = L.circle(c, {
							...ZONE_STYLE,
							radius: seed.circleRadius,
						}).addTo(map);
						setLayer(layer);
						layer.pm.enable();
						wireEdit(layer);
						map.fitBounds(layer.getBounds(), {
							padding: [40, 40],
							maxZoom: 15,
						});
						seeded = true;
					}
				} else if (method === "polygon") {
					const pts = seed.coordinates
						.map(parseLatLng)
						.filter((p): p is [number, number] => p !== null);
					if (pts.length >= 3) {
						const layer = L.polygon(pts, ZONE_STYLE).addTo(map);
						setLayer(layer);
						layer.pm.enable();
						wireEdit(layer);
						map.fitBounds(layer.getBounds(), {
							padding: [40, 40],
							maxZoom: 15,
						});
						seeded = true;
					}
				}
			}
			// nothing drawn yet — open near the visitor's region (from their timezone)
			if (!seeded) {
				const view = timezoneToView(localTimezone());
				if (view) map.setView(view.center, view.zoom);
			}

			setTimeout(() => {
				if (!cancelled) map.invalidateSize();
			}, 80);
		})();
		return () => {
			cancelled = true;
			mapRef.current?.remove();
			mapRef.current = null;
			layerRef.current = null;
			tileRef.current = null;
		};
	}, [method]);

	useEffect(() => {
		const L = LRef.current;
		const map = mapRef.current;
		if (!L || !map) return;
		if (tileRef.current) map.removeLayer(tileRef.current);
		tileRef.current = tileLayer(L, dark).addTo(map);
		tileRef.current.bringToBack();
	}, [dark]);

	const startDraw = () => {
		const map = mapRef.current;
		if (!map) return;
		if (layerRef.current) {
			map.removeLayer(layerRef.current);
			layerRef.current = null;
		}
		map.pm.enableDraw(method === "circle" ? "Circle" : "Polygon", {
			...(method === "circle" ? { resizeableCircle: true } : {}),
			pathOptions: ZONE_STYLE,
		});
	};

	const clearShape = () => {
		const map = mapRef.current;
		if (map) {
			map.pm.disableDraw();
			if (layerRef.current) {
				map.removeLayer(layerRef.current);
				layerRef.current = null;
			}
		}
		onChange({ method, coordinates: [], circleRadius: null });
	};

	const runSearch = async () => {
		const q = search.trim();
		if (!q || !mapRef.current) return;
		setSearching(true);
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
				{ headers: { "Accept-Language": "en" } },
			);
			if (!res.ok) throw new Error(`Search failed (${res.status})`);
			const data = (await res.json()) as { lat: string; lon: string }[];
			if (data[0]) {
				mapRef.current.setView([Number(data[0].lat), Number(data[0].lon)], 13);
			} else {
				toast.error("No place found for that search.");
			}
		} catch {
			toast.error("Couldn't search right now. Try again.");
		} finally {
			setSearching(false);
		}
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				{METHODS.map((m) => (
					<button
						key={m.id}
						type="button"
						onClick={() => {
							if (m.id === method) return;
							onChange({ method: m.id, coordinates: [], circleRadius: null });
						}}
						className={cn(
							"rounded-full border px-3 py-1.5 text-sm transition-colors",
							method === m.id
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-muted-foreground hover:bg-accent",
						)}
					>
						{m.label}
					</button>
				))}
			</div>

			{method === "virtual" ? (
				<p className="text-sm text-muted-foreground">
					This event has no physical location and won't appear on the map.
				</p>
			) : (
				<div className="space-y-2">
					<div className="flex gap-2">
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									runSearch();
								}
							}}
							placeholder="Search a place to centre the map…"
						/>
						<Button
							type="button"
							variant="outline"
							onClick={runSearch}
							disabled={searching}
						>
							{searching ? "…" : "Find"}
						</Button>
					</div>

					<div className="relative h-72 overflow-hidden rounded-xl border border-border">
						<div ref={containerRef} className="h-full w-full" />
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={startDraw}
						>
							{hasShape
								? "Redraw"
								: `Draw ${method === "circle" ? "circle" : "shape"}`}
						</Button>
						{hasShape ? (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={clearShape}
							>
								Clear
							</Button>
						) : null}
						<span className="text-xs text-muted-foreground">
							{METHODS.find((m) => m.id === method)?.hint}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
