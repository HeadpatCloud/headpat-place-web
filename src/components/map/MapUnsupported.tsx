import { ExternalLinkIcon, MapPinOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MAP_UNSUPPORTED_EVENT, supportsWebGL2 } from "./leaflet-shared";

const WEBGL_HELP_URL =
	"https://wiki.openstreetmap.org/wiki/This_map_requires_WebGL";

/** True once we know the vector map can't render in this browser. */
export function useMapUnsupported(): boolean {
	const [unsupported, setUnsupported] = useState(false);
	useEffect(() => {
		if (!supportsWebGL2()) setUnsupported(true);
		const onUnsupported = () => setUnsupported(true);
		window.addEventListener(MAP_UNSUPPORTED_EVENT, onUnsupported);
		return () =>
			window.removeEventListener(MAP_UNSUPPORTED_EVENT, onUnsupported);
	}, []);
	return unsupported;
}

/** Covers a map container with an explanation instead of a grey canvas. */
export function MapUnsupported({ compact = false }: { compact?: boolean }) {
	const t = useTranslations("commonUi");
	return (
		<div
			role="alert"
			className="absolute inset-0 z-[1000] flex items-center justify-center bg-card p-6 text-center"
		>
			<div
				className={cn(
					"flex max-w-sm flex-col items-center",
					compact ? "gap-2" : "gap-3",
				)}
			>
				<span
					className={cn(
						"flex items-center justify-center rounded-full bg-link/15 text-link",
						compact ? "size-10" : "size-14",
					)}
				>
					<MapPinOffIcon className={compact ? "size-5" : "size-7"} />
				</span>
				<h2
					className={cn(
						"font-semibold text-foreground",
						compact ? "text-base" : "text-lg",
					)}
				>
					{t("mapUnsupportedTitle")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("mapUnsupportedBody")}
				</p>
				<a
					href={WEBGL_HELP_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-link hover:underline"
				>
					{t("mapUnsupportedLink")}
					<ExternalLinkIcon className="size-3.5" />
				</a>
			</div>
		</div>
	);
}
