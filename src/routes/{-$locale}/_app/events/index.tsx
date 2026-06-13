import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Pager } from "@/components/Pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/events/")({
	component: EventsPage,
});

const PAGE_SIZE = 24;

function EventsPage() {
	const t = useTranslations("eventsPages");
	const c = useTranslations("common");
	const [page, setPage] = useState(1);
	const fmt = useDateFormat();
	const { data: session } = useSession();
	const events = useQuery(
		orpc.event.list.queryOptions({ input: { page, pageSize: PAGE_SIZE } }),
	);
	const items = events.data?.items ?? [];

	return (
		<main className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-2xl font-bold">{t("title")}</h2>
				{session?.user ? (
					<Button
						asChild
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<Link to={"/events/new" as never}>
							<PlusIcon className="size-4" />
							{t("newEvent")}
						</Link>
					</Button>
				) : null}
			</div>
			{events.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">{t("emptyState")}</p>
			) : (
				<>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{items.map((e) => (
							<Link key={e.id} to={`/events/${e.id}` as never}>
								<Card className="hover:bg-accent transition-colors">
									<CardHeader>
										<CardTitle>{e.title}</CardTitle>
									</CardHeader>
									<CardContent className="space-y-2">
										<p className="text-sm text-muted-foreground">
											{fmt.dateTime(e.startsAt)}
										</p>
										{e.locationText ? (
											<p className="text-sm">{e.locationText}</p>
										) : null}
										<div className="flex gap-1 flex-wrap">
											{(e.tags ?? []).map((t) => (
												<Badge key={t} variant="secondary">
													{t}
												</Badge>
											))}
										</div>
										<p className="text-xs text-muted-foreground">
											{t("nAttending", { count: e.attendeesCount })}
										</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
					<Pager
						page={page}
						total={events.data?.total ?? 0}
						pageSize={PAGE_SIZE}
						onPageChange={setPage}
					/>
				</>
			)}
		</main>
	);
}
