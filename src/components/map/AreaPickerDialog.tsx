import "leaflet/dist/leaflet.css";
import type * as LType from "leaflet";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import {
	addTiles,
	loadLeaflet,
	localTimezone,
	pinIcon,
	timezoneToView,
} from "./leaflet-shared";
import { MapUnsupported, useMapUnsupported } from "./MapUnsupported";
import type { LatLng } from "./nearby";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPick: (pos: LatLng) => void;
	busy?: boolean;
};

/** Lets someone drop a pin where they are when the browser can't locate
 *  them. The API snaps the spot to the same grid cell as a real fix. */
export function AreaPickerDialog({ open, onOpenChange, onPick, busy }: Props) {
	const t = useTranslations("nearby");
	const { resolvedTheme } = useTheme();
	const darkRef = useRef(resolvedTheme === "dark");
	darkRef.current = resolvedTheme === "dark";

	// a callback ref, because the dialog mounts its content only while open
	const [container, setContainer] = useState<HTMLDivElement | null>(null);
	const mapRef = useRef<LType.Map | null>(null);
	const markerRef = useRef<LType.Marker | null>(null);
	const [picked, setPicked] = useState<LatLng | null>(null);
	const [search, setSearch] = useState("");
	const [searching, setSearching] = useState(false);
	const unsupported = useMapUnsupported();

	useEffect(() => {
		if (!container) return;
		let cancelled = false;
		(async () => {
			const L = await loadLeaflet();
			if (cancelled) return;
			const view = timezoneToView(localTimezone());
			const map = L.map(container, {
				center: view?.center ?? [50, 10],
				zoom: view?.zoom ?? 4,
				worldCopyJump: true,
			});
			mapRef.current = map;
			addTiles(L, map, darkRef.current);

			const place = (latlng: LType.LatLng) => {
				const pos = { lat: latlng.lat, lng: latlng.lng };
				if (markerRef.current) {
					markerRef.current.setLatLng(latlng);
				} else {
					const marker = L.marker(latlng, {
						icon: pinIcon(L),
						draggable: true,
					}).addTo(map);
					marker.on("dragend", () => {
						const p = marker.getLatLng();
						setPicked({ lat: p.lat, lng: p.lng });
					});
					markerRef.current = marker;
				}
				setPicked(pos);
			};
			map.on("click", (e: LType.LeafletMouseEvent) => place(e.latlng));

			// the dialog animates in, so measure again once it has settled
			setTimeout(() => {
				if (!cancelled) map.invalidateSize();
			}, 250);
		})();
		return () => {
			cancelled = true;
			mapRef.current?.remove();
			mapRef.current = null;
			markerRef.current = null;
			setPicked(null);
		};
	}, [container]);

	const runSearch = async () => {
		const q = search.trim();
		if (!q || !mapRef.current) return;
		setSearching(true);
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
			);
			if (!res.ok) throw new Error(`search failed: ${res.status}`);
			const data = (await res.json()) as { lat: string; lon: string }[];
			if (data[0]) {
				mapRef.current.setView([Number(data[0].lat), Number(data[0].lon)], 13);
			} else {
				toast.error(t("picker.noResult"));
			}
		} catch {
			toast.error(t("picker.searchFailed"));
		} finally {
			setSearching(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>{t("picker.title")}</DialogTitle>
					<DialogDescription>{t("picker.hint")}</DialogDescription>
				</DialogHeader>
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
						placeholder={t("picker.search")}
						aria-label={t("picker.search")}
					/>
					<Button
						type="button"
						variant="outline"
						onClick={runSearch}
						disabled={searching}
					>
						{t("picker.find")}
					</Button>
				</div>
				<div className="relative h-80 overflow-hidden rounded-xl border border-border">
					<div ref={setContainer} className="h-full w-full" />
					{unsupported ? <MapUnsupported compact /> : null}
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t("picker.cancel")}
					</Button>
					<Button
						type="button"
						disabled={!picked || busy}
						onClick={() => {
							if (picked) onPick(picked);
						}}
					>
						{t("picker.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
