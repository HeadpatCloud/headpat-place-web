import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDateFormat } from "@/lib/datetime";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/announcements/$announcementId")({
	component: AnnouncementPage,
});

function AnnouncementPage() {
	const { announcementId } = Route.useParams();
	const fmt = useDateFormat();
	const ann = useQuery(
		orpc.announcement.byId.queryOptions({ input: { announcementId } }),
	);

	if (ann.isPending)
		return <p className="p-4 text-muted-foreground">Loading…</p>;
	if (ann.isError || !ann.data) return <p className="p-4">Not found.</p>;
	const a = ann.data;

	return (
		<main className="mx-auto max-w-3xl">
			<Card>
				{a.title ? (
					<CardHeader>
						<CardTitle className="text-2xl">{a.title}</CardTitle>
					</CardHeader>
				) : null}
				<CardContent>
					<p className="whitespace-pre-wrap">{a.description}</p>
					<p className="text-xs text-muted-foreground mt-4">
						{fmt.dateTime(a.createdAt)}
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
