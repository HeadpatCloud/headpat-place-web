import { createFileRoute } from "@tanstack/react-router";
import { MapView } from "@/components/map/MapView";

declare module "@tanstack/react-router" {
	interface StaticDataRouteOption {
		fullWidth?: boolean;
	}
}

export const Route = createFileRoute("/{-$locale}/_app/map")({
	component: MapPage,
	staticData: { fullWidth: true },
	head: () => ({ meta: [{ title: "Map" }] }),
});

function MapPage() {
	return (
		<div className="h-full w-full overflow-hidden border-t border-border bg-card">
			<MapView />
		</div>
	);
}
