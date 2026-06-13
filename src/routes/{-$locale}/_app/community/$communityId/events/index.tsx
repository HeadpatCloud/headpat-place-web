import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute(
	"/{-$locale}/_app/community/$communityId/events/",
)({
	component: CommunityEventsPage,
});

function CommunityEventsPage() {
	const t = useTranslations("communityPages");
	const { communityId } = Route.useParams();
	const fmt = useDateFormat();
	const events = useQuery(
		orpc.event.listByCommunity.queryOptions({ input: { communityId } }),
	);

	return (
		<main className="space-y-4">
			<h2 className="text-2xl font-bold">{t("eventsTitle")}</h2>
			{events.isPending ? (
				<p className="text-muted-foreground">{t("loading")}</p>
			) : (events.data ?? []).length === 0 ? (
				<p className="text-muted-foreground">{t("noEventsYet")}</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					{(events.data ?? []).map((e) => (
						<Link key={e.id} to={`/events/${e.id}` as never}>
							<Card className="hover:bg-accent transition-colors">
								<CardHeader>
									<CardTitle>{e.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										{fmt.dateTime(e.startsAt)}
									</p>
									{e.locationText ? (
										<p className="text-sm">{e.locationText}</p>
									) : null}
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</main>
	);
}
