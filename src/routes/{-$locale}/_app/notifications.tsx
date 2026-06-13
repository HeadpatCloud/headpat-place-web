import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pager } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/notifications")({
	component: NotificationsPage,
});

const PAGE_SIZE = 30;

function NotificationsPage() {
	const [page, setPage] = useState(1);
	const t = useTranslations("miscPages");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const navigate = useNavigate();
	const fmt = useDateFormat();
	const list = useQuery(
		orpc.notification.list.queryOptions({
			input: { page, pageSize: PAGE_SIZE },
		}),
	);
	const items = list.data?.items ?? [];

	function invalidate() {
		qc.invalidateQueries({
			queryKey: orpc.notification.list.queryKey({
				input: { page, pageSize: PAGE_SIZE },
			}),
		});
		qc.invalidateQueries({
			queryKey: orpc.notification.unreadCount.queryKey({ input: undefined }),
		});
	}

	const markAll = useMutation({
		mutationFn: async () => client.notification.markAllRead(),
		onSuccess: invalidate,
	});

	async function open(n: { id: string; read: boolean; link: string | null }) {
		if (!n.read) {
			await client.notification.markRead({ notificationId: n.id });
			invalidate();
		}
		if (n.link) navigate({ to: n.link as never });
	}

	return (
		<main className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">{t("notificationsTitle")}</h2>
				<Button variant="outline" onClick={() => markAll.mutate()}>
					{t("notificationsMarkAllRead")}
				</Button>
			</div>
			{list.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">{t("notificationsEmpty")}</p>
			) : (
				<>
					<div className="space-y-1">
						{items.map((n) => (
							<button
								key={n.id}
								type="button"
								onClick={() => open(n)}
								className={`flex w-full items-start gap-3 rounded-lg p-3 text-left ${n.link ? "card-hover" : ""} ${!n.read ? "bg-primary/5" : ""}`}
							>
								<div className="h-9 w-9 shrink-0 rounded-lg border border-border bg-primary/15" />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold leading-snug">
										{n.message}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{fmt.dateTime(n.createdAt)}
									</p>
								</div>
								{!n.read ? (
									<span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
								) : null}
							</button>
						))}
					</div>
					<Pager
						page={page}
						total={list.data?.total ?? 0}
						pageSize={PAGE_SIZE}
						onPageChange={setPage}
					/>
				</>
			)}
		</main>
	);
}
