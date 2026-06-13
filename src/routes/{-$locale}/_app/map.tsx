import { createFileRoute } from "@tanstack/react-router";
import { MapView } from "@/components/map/MapView";

export const Route = createFileRoute("/{-$locale}/_app/map")({
	component: MapPage,
	head: () => ({ meta: [{ title: "Map" }] }),
});

function MapPage() {
	return (
		<div className="h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-border bg-card">
			<MapView />
		</div>
	);
}
