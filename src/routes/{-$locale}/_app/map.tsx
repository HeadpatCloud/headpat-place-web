import { createFileRoute } from "@tanstack/react-router";
import { MapView } from "@/components/map/MapView";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n";
import { seo } from "@/lib/seo";

declare module "@tanstack/react-router" {
	interface StaticDataRouteOption {
		fullWidth?: boolean;
	}
}

export const Route = createFileRoute("/{-$locale}/_app/map")({
	component: MapPage,
	staticData: { fullWidth: true },
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({ title: translate(locale, "nav.map"), path: "/map", locale });
	},
});

function MapPage() {
	return (
		<div className="h-full w-full overflow-hidden border-t border-border bg-card">
			<MapView />
		</div>
	);
}
