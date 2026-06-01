import { createFileRoute } from "@tanstack/react-router";
import { MapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/map")({
	component: MapPage,
	head: () => ({ meta: [{ title: "Map" }] }),
});

function MapPage() {
	return (
		<main className="space-y-4">
			<Card>
				<CardHeader className="flex flex-row items-center gap-3">
					<MapIcon className="h-5 w-5" />
					<CardTitle>Map</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p>
						Once enabled, the map shows live status and approximate location of
						other users and events from communities you're in.
					</p>
					<p className="text-muted-foreground text-sm">
						This page is not wired up yet — the location publish/list APIs are
						still on the backlog. Drop a note in{" "}
						<a className="underline" href="/support">
							Support
						</a>{" "}
						if you want this prioritized.
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
