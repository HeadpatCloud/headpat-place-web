import type * as LType from "leaflet";

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
export const ATTRIBUTION =
	'<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
export const ACCENT = "#10b981";
/** Distinct from event green — shared-user location markers. */
export const PERSON_COLOR = "#6366f1";

// Keeps the map flat and simple: no tunnels or bridges, 3D buildings, road
// outlines, shields, rail hatching, one-way arrows, airports or borders.
const DROPPED_LAYERS =
	/^(tunnel_|bridge_|building-3d$|road_area_pattern$|road_one_way_arrow|aeroway_|boundary_|highway-shield|road_shield|park_outline$)|(_casing|_hatching)$/;

let mapStyle: import("maplibre-gl").StyleSpecification;
let maplibreGL: typeof import("@maplibre/maplibre-gl-leaflet").maplibreGL;
let leafletPromise: Promise<typeof LType> | null = null;
/** Lazily load Leaflet client-side (it touches `window`, so never on the server). */
export function loadLeaflet(): Promise<typeof LType> {
	if (!leafletPromise) {
		leafletPromise = Promise.all([
			fetch(MAP_STYLE).then((r) => {
				if (!r.ok) throw new Error(`map style failed: ${r.status}`);
				return r.json();
			}),
			import("leaflet"),
			import("@maplibre/maplibre-gl-leaflet"),
			import("maplibre-gl"),
			import("maplibre-gl/dist/maplibre-gl-worker.mjs?url"),
			import("maplibre-gl/dist/maplibre-gl.css"),
		]).then(([style, leaflet, plugin, maplibre, worker]) => {
			style.layers = style.layers.filter(
				(l: { id: string }) => !DROPPED_LAYERS.test(l.id),
			);
			mapStyle = style as import("maplibre-gl").StyleSpecification;
			maplibre.setWorkerUrl(worker.default);
			maplibreGL = plugin.maplibreGL;
			return leaflet.default ?? leaflet;
		});
	}
	return leafletPromise;
}

let geomanPromise: Promise<unknown> | null = null;
/** Load geoman, which patches `L.Map.prototype.pm`. Call after loadLeaflet, before creating the map. */
export function loadGeoman(): Promise<unknown> {
	if (!geomanPromise) {
		geomanPromise = import("@geoman-io/leaflet-geoman-free");
	}
	return geomanPromise;
}

let clusterPromise: Promise<unknown> | null = null;
/** Load markercluster, which adds `L.markerClusterGroup`. Call after loadLeaflet, before creating a cluster group. */
export function loadMarkerCluster(): Promise<unknown> {
	if (!clusterPromise) {
		clusterPromise = import("leaflet.markercluster");
	}
	return clusterPromise;
}

/** Shared fill/stroke for drawn + rendered event zones. */
export const ZONE_STYLE = {
	color: ACCENT,
	weight: 2,
	fillColor: ACCENT,
	fillOpacity: 0.2,
} as const;

export function parseLatLng(s: string): [number, number] | null {
	const [lat, lng] = s.split(",").map(Number);
	return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

export function tileLayer(_L: typeof LType, dark: boolean): LType.Layer {
	const layer = maplibreGL({
		style: mapStyle,
		attribution: ATTRIBUTION,
		fadeDuration: 0,
		pixelRatio: Math.min(window.devicePixelRatio, 2),
		renderWorldCopies: false,
	} as Parameters<typeof maplibreGL>[0]);
	layer.once("add", () =>
		layer.getContainer().classList.toggle("map-tiles-dark", dark),
	);
	return layer;
}

type MapPosition = { center: [number, number]; zoom: number };

// Rough country/region anchors so a fresh map opens near the visitor instead of
// at the whole world — derived from their timezone, which needs no permission.
const TZ_VIEWS: Record<string, MapPosition> = {
	"Europe/Amsterdam": { center: [52.2, 5.3], zoom: 7 },
	"Europe/Brussels": { center: [50.6, 4.6], zoom: 7 },
	"Europe/London": { center: [54, -2], zoom: 5 },
	"Europe/Paris": { center: [46.6, 2.5], zoom: 5 },
	"Europe/Berlin": { center: [51, 10], zoom: 5 },
	"Europe/Madrid": { center: [40, -3.7], zoom: 5 },
	"Europe/Rome": { center: [42.5, 12.5], zoom: 5 },
	"Europe/Lisbon": { center: [39.5, -8], zoom: 6 },
	"Europe/Dublin": { center: [53.4, -8], zoom: 6 },
	"Europe/Zurich": { center: [46.8, 8.2], zoom: 7 },
	"Europe/Vienna": { center: [47.6, 14], zoom: 6 },
	"Europe/Warsaw": { center: [52, 19], zoom: 5 },
	"Europe/Prague": { center: [49.8, 15.5], zoom: 6 },
	"Europe/Stockholm": { center: [62, 16], zoom: 4 },
	"Europe/Oslo": { center: [61, 9], zoom: 4 },
	"Europe/Copenhagen": { center: [56, 10], zoom: 6 },
	"Europe/Helsinki": { center: [64, 26], zoom: 4 },
	"Europe/Athens": { center: [39, 22], zoom: 6 },
	"Europe/Bucharest": { center: [46, 25], zoom: 6 },
	"Europe/Budapest": { center: [47, 19.5], zoom: 6 },
	"Europe/Moscow": { center: [56, 38], zoom: 5 },
	"Europe/Kyiv": { center: [49, 32], zoom: 5 },
	"Europe/Istanbul": { center: [39, 35], zoom: 5 },
	"America/New_York": { center: [40, -77], zoom: 5 },
	"America/Chicago": { center: [40, -92], zoom: 5 },
	"America/Denver": { center: [39, -106], zoom: 5 },
	"America/Los_Angeles": { center: [37, -120], zoom: 5 },
	"America/Toronto": { center: [50, -85], zoom: 4 },
	"America/Vancouver": { center: [52, -123], zoom: 4 },
	"America/Mexico_City": { center: [23, -102], zoom: 5 },
	"America/Sao_Paulo": { center: [-15, -50], zoom: 4 },
	"America/Argentina/Buenos_Aires": { center: [-38, -63], zoom: 4 },
	"America/Bogota": { center: [4, -73], zoom: 5 },
	"America/Lima": { center: [-10, -76], zoom: 5 },
	"America/Santiago": { center: [-35, -71], zoom: 4 },
	"Asia/Tokyo": { center: [37, 138], zoom: 5 },
	"Asia/Shanghai": { center: [35, 104], zoom: 4 },
	"Asia/Hong_Kong": { center: [22.3, 114], zoom: 9 },
	"Asia/Singapore": { center: [1.35, 103.8], zoom: 10 },
	"Asia/Seoul": { center: [36, 128], zoom: 6 },
	"Asia/Kolkata": { center: [22, 79], zoom: 4 },
	"Asia/Dubai": { center: [24, 54], zoom: 6 },
	"Asia/Jakarta": { center: [-2, 117], zoom: 4 },
	"Asia/Bangkok": { center: [15, 101], zoom: 5 },
	"Asia/Manila": { center: [13, 122], zoom: 5 },
	"Australia/Sydney": { center: [-33, 150], zoom: 5 },
	"Australia/Melbourne": { center: [-37, 145], zoom: 6 },
	"Australia/Perth": { center: [-32, 116], zoom: 6 },
	"Pacific/Auckland": { center: [-41, 174], zoom: 5 },
	"Africa/Johannesburg": { center: [-29, 25], zoom: 5 },
	"Africa/Cairo": { center: [27, 30], zoom: 5 },
	"Africa/Lagos": { center: [9, 8], zoom: 6 },
	"Africa/Nairobi": { center: [0, 38], zoom: 6 },
};

const PREFIX_VIEWS: Record<string, MapPosition> = {
	Europe: { center: [50, 10], zoom: 4 },
	America: { center: [40, -100], zoom: 3 },
	Asia: { center: [30, 100], zoom: 3 },
	Africa: { center: [2, 20], zoom: 3 },
	Australia: { center: [-25, 134], zoom: 4 },
	Pacific: { center: [-10, 170], zoom: 3 },
	Indian: { center: [-10, 70], zoom: 3 },
	Atlantic: { center: [40, -30], zoom: 3 },
};

/** The browser's IANA timezone — a permission-free hint at the visitor's region. */
export function localTimezone(): string | undefined {
	return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
}

/** Map an IANA timezone to a rough country/continent map view, or null if unknown. */
export function timezoneToView(tz?: string | null): MapPosition | null {
	if (!tz) return null;
	if (TZ_VIEWS[tz]) return TZ_VIEWS[tz];
	return PREFIX_VIEWS[tz.split("/")[0]] ?? null;
}

/** Round avatar marker for shared locations: the profile picture if there is
 *  one, otherwise the user's initial. The initial sits behind the image so it
 *  shows through if the avatar fails to load. */
export function personIcon(
	L: typeof LType,
	label: string,
	avatarUrl?: string | null,
): LType.DivIcon {
	const ch = (label || "?").trim().charAt(0).toUpperCase() || "?";
	const initial =
		ch === "<" || ch === ">" || ch === "&" || ch === '"' ? "?" : ch;
	const img = avatarUrl
		? `<img src="${avatarUrl.replace(/"/g, "%22")}" alt="" onerror="this.style.display='none'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />`
		: "";
	const html = `<div style="position:relative;width:32px;height:32px;border-radius:9999px;overflow:hidden;background:${PERSON_COLOR};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${initial}${img}</div>`;
	return L.divIcon({
		html,
		className: "",
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		popupAnchor: [0, -18],
	});
}

/** Count badge for a group of overlapping event pins; size + halo scale with the
 *  number of events so a dense area reads as a bigger circle. */
export function clusterIcon(L: typeof LType, count: number): LType.DivIcon {
	const size = count < 10 ? 36 : count < 100 ? 44 : 52;
	const inner = size - 10;
	const html = `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:rgba(16,185,129,.30)"><div style="display:flex;align-items:center;justify-content:center;width:${inner}px;height:${inner}px;border-radius:9999px;background:${ACCENT};color:#fff;font-weight:700;font-size:${count < 100 ? 14 : 13}px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${count}</div></div>`;
	return L.divIcon({
		html,
		className: "",
		iconSize: [size, size],
		iconAnchor: [size / 2, size / 2],
	});
}

export function pinIcon(L: typeof LType): LType.DivIcon {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${ACCENT}" stroke="#fff" stroke-width="2"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>`;
	return L.divIcon({
		html: svg,
		className: "",
		iconSize: [26, 34],
		iconAnchor: [13, 34],
		popupAnchor: [0, -30],
	});
}
