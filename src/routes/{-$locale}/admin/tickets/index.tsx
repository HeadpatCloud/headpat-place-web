import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserCard, type UserSummary } from "@/components/UserCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/tickets/")({
	component: TicketsList,
});

const filters = [
	{ labelKey: null, value: undefined },
	{ labelKey: "filterOpen", value: "open" as const },
	{ labelKey: "filterClosed", value: "closed" as const },
];

function TicketsList() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const [status, setStatus] = useState<"open" | "closed" | undefined>(
		undefined,
	);
	const tickets = useQuery(
		orpc.ticket.adminList.queryOptions({ input: { status } }),
	);

	return (
		<div className="space-y-4">
			<h1 className="font-display text-3xl font-semibold tracking-tight">
				{t("tickets")}
			</h1>
			<div className="flex gap-2">
				{filters.map((f) => (
					<Button
						key={f.value ?? "all"}
						size="sm"
						variant={status === f.value ? "default" : "outline"}
						className={
							status === f.value
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: ""
						}
						onClick={() => setStatus(f.value)}
					>
						{f.labelKey ? t(f.labelKey) : c("all")}
					</Button>
				))}
			</div>

			{tickets.isError ? (
				<p className="text-muted-foreground">{t("noAccess")}</p>
			) : tickets.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : (
				<div className="space-y-2">
					{(tickets.data ?? []).map((t) => (
						<Card key={t.id} className="space-y-2 p-3">
							<Link to={`/admin/tickets/${t.id}` as never} className="block">
								<div className="flex items-center justify-between gap-2">
									<span className="font-semibold">{t.subject}</span>
									<Badge
										variant={t.status === "open" ? "default" : "secondary"}
									>
										{t.status}
									</Badge>
								</div>
								<span className="text-xs text-muted-foreground">
									{t.category} · {t.priority}
								</span>
							</Link>
							{t.author ? <UserCard user={t.author as UserSummary} /> : null}
						</Card>
					))}
					{(tickets.data ?? []).length === 0 ? (
						<p className="text-muted-foreground text-sm">{t("noTickets")}</p>
					) : null}
				</div>
			)}
		</div>
	);
}
