import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pager } from "@/components/Pager";
import { UserCard } from "@/components/UserCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";

const PAGE_SIZE = 12;

/** The "who's going" list on an event page. Signed-in viewers only. */
export function EventAttendees({
	eventId,
	isPast,
}: {
	eventId: string;
	isPast: boolean;
}) {
	const t = useTranslations("eventsPages");
	const c = useTranslations("common");
	const [page, setPage] = useState(1);
	const attendees = useQuery(
		orpc.event.attendees.queryOptions({
			input: { eventId, page, pageSize: PAGE_SIZE },
		}),
	);
	const items = attendees.data?.items ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{isPast ? t("whoWent") : t("whoIsGoing")}</CardTitle>
			</CardHeader>
			<CardContent>
				{attendees.isPending ? (
					<p className="text-muted-foreground">{c("loading")}</p>
				) : items.length === 0 ? (
					<p className="text-muted-foreground">
						{isPast ? t("nobodyWent") : t("nobodyGoing")}
					</p>
				) : (
					<>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{items.map((u) => (
								<UserCard key={u.userId} user={u} />
							))}
						</div>
						<Pager
							page={page}
							total={attendees.data?.total ?? 0}
							pageSize={PAGE_SIZE}
							onPageChange={setPage}
						/>
					</>
				)}
			</CardContent>
		</Card>
	);
}
