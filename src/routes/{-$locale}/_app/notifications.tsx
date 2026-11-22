import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	BellIcon,
	BellRingIcon,
	CalendarClockIcon,
	CheckCheckIcon,
	CheckIcon,
	ImageIcon,
	LifeBuoyIcon,
	type LucideIcon,
	MessageCircleIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UserPlusIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pager } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateFormat } from "@/lib/datetime";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/{-$locale}/_app/notifications")({
	head: pageHead("titles.notifications", "/notifications", { noindex: true }),
	component: NotificationsPage,
});

const PAGE_SIZE = 30;

type NotificationItem = Awaited<
	ReturnType<typeof client.notification.list>
>["items"][number];

// Each type gets its own icon and tint so the list scans at a glance.
const TYPE_STYLES: Record<string, { icon: LucideIcon; tint: string }> = {
	newFollower: { icon: UserPlusIcon, tint: "bg-pink-500/15 text-pink-500" },
	newMessage: {
		icon: MessageCircleIcon,
		tint: "bg-sky-500/15 text-sky-500",
	},
	galleryComment: {
		icon: ImageIcon,
		tint: "bg-violet-500/15 text-violet-500",
	},
	eventReminder: {
		icon: CalendarClockIcon,
		tint: "bg-amber-500/15 text-amber-500",
	},
	ticketReply: {
		icon: LifeBuoyIcon,
		tint: "bg-orange-500/15 text-orange-500",
	},
	reportResolved: {
		icon: ShieldCheckIcon,
		tint: "bg-emerald-500/15 text-emerald-500",
	},
};
const FALLBACK_STYLE = { icon: BellIcon, tint: "bg-link/15 text-link" };

function dayKey(d: Date, timeZone: string | undefined): string {
	return d.toLocaleDateString("en-CA", { timeZone });
}

function useRelativeTime() {
	const locale = useLocale();
	return useMemo(() => {
		const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
		return (d: Date) => {
			const sec = Math.round((d.getTime() - Date.now()) / 1000);
			const abs = Math.abs(sec);
			if (abs < 60) return rtf.format(0, "second");
			if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
			if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour");
			if (abs < 604800) return rtf.format(Math.round(sec / 86400), "day");
			return null;
		};
	}, [locale]);
}

function NotificationRow({
	n,
	onOpen,
	onMarkRead,
	onDelete,
}: {
	n: NotificationItem;
	onOpen: () => void;
	onMarkRead: () => void;
	onDelete: () => void;
}) {
	const t = useTranslations("notifications");
	const fmt = useDateFormat();
	const relative = useRelativeTime();
	const created = new Date(n.createdAt);
	const style = TYPE_STYLES[n.type] ?? FALLBACK_STYLE;
	const Icon = style.icon;
	const when =
		relative(created) ?? fmt.date(created, { day: "numeric", month: "short" });

	return (
		<li
			className={cn(
				"group relative flex items-center gap-3 px-4 py-3 transition-colors sm:gap-4 sm:px-5",
				n.link && "hover:bg-muted/60",
				!n.read && "bg-primary/5",
			)}
		>
			{!n.read ? (
				<span
					aria-hidden
					className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-primary"
				/>
			) : null}
			<button
				type="button"
				onClick={onOpen}
				className={cn(
					"flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4",
					!n.link && "cursor-default",
				)}
			>
				<span
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-full",
						style.tint,
					)}
				>
					<Icon className="size-5" />
				</span>
				<span className="min-w-0 flex-1">
					<span
						className={cn(
							"block text-sm leading-snug",
							n.read
								? "text-muted-foreground"
								: "font-semibold text-foreground",
						)}
					>
						{n.message}
					</span>
					<time
						dateTime={created.toISOString()}
						title={fmt.dateTime(created)}
						className="mt-0.5 block text-xs text-muted-foreground"
					>
						{when}
					</time>
				</span>
			</button>
			<div className="hidden shrink-0 items-center gap-1 transition-opacity sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
				{!n.read ? (
					<Button
						variant="ghost"
						size="icon"
						className="size-8 rounded-full"
						onClick={onMarkRead}
						aria-label={t("markRead")}
						title={t("markRead")}
					>
						<CheckIcon className="size-4" />
					</Button>
				) : null}
				<Button
					variant="ghost"
					size="icon"
					className="size-8 rounded-full text-muted-foreground hover:text-destructive"
					onClick={onDelete}
					aria-label={t("delete")}
					title={t("delete")}
				>
					<Trash2Icon className="size-4" />
				</Button>
			</div>
			{!n.read ? (
				<span
					aria-hidden
					className="size-2 shrink-0 rounded-full bg-primary sm:group-hover:hidden"
				/>
			) : null}
		</li>
	);
}

function NotificationsPage() {
	const [page, setPage] = useState(1);
	const t = useTranslations("notifications");
	const qc = useQueryClient();
	const navigate = useNavigate();
	const fmt = useDateFormat();
	const listKey = orpc.notification.list.queryKey({
		input: { page, pageSize: PAGE_SIZE },
	});
	const list = useQuery(
		orpc.notification.list.queryOptions({
			input: { page, pageSize: PAGE_SIZE },
		}),
	);
	const unread = useQuery(
		orpc.notification.unreadCount.queryOptions({ input: undefined }),
	);
	const items: NotificationItem[] = list.data?.items ?? [];
	const unreadCount = unread.data?.count ?? 0;

	function invalidate() {
		qc.invalidateQueries({ queryKey: orpc.notification.list.key() });
		qc.invalidateQueries({
			queryKey: orpc.notification.unreadCount.queryKey({ input: undefined }),
		});
	}

	// optimistic: flip the row locally, then sync with the server
	function patchItems(fn: (items: NotificationItem[]) => NotificationItem[]) {
		qc.setQueryData(listKey, (old) =>
			old ? { ...old, items: fn(old.items) } : old,
		);
	}

	const markAll = useMutation({
		mutationFn: () => client.notification.markAllRead(),
		onMutate: () => patchItems((all) => all.map((n) => ({ ...n, read: true }))),
		onError: () => toast.error(t("markAllReadError")),
		onSettled: invalidate,
	});
	const markRead = useMutation({
		mutationFn: (id: string) =>
			client.notification.markRead({ notificationId: id }),
		onMutate: (id) =>
			patchItems((all) =>
				all.map((n) => (n.id === id ? { ...n, read: true } : n)),
			),
		onError: () => toast.error(t("markReadError")),
		onSettled: invalidate,
	});
	const remove = useMutation({
		mutationFn: (id: string) =>
			client.notification.delete({ notificationId: id }),
		onMutate: (id) => patchItems((all) => all.filter((n) => n.id !== id)),
		onError: () => toast.error(t("deleteError")),
		onSettled: invalidate,
	});

	function open(n: NotificationItem) {
		if (!n.read) markRead.mutate(n.id);
		if (n.link) navigate({ to: n.link as never });
	}

	// group rows under Today / Yesterday / a date heading
	const groups = useMemo(() => {
		const today = dayKey(new Date(), fmt.timeZone);
		const yesterday = dayKey(new Date(Date.now() - 86_400_000), fmt.timeZone);
		const out: { key: string; label: string; items: NotificationItem[] }[] = [];
		for (const n of items) {
			const d = new Date(n.createdAt);
			const key = dayKey(d, fmt.timeZone);
			let group = out[out.length - 1];
			if (!group || group.key !== key) {
				const label =
					key === today
						? t("today")
						: key === yesterday
							? t("yesterday")
							: fmt.date(d, { weekday: "long", day: "numeric", month: "long" });
				group = { key, label, items: [] };
				out.push(group);
			}
			group.items.push(n);
		}
		return out;
	}, [items, fmt, t]);

	return (
		<main className="mx-auto w-full max-w-3xl space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div className="flex items-center gap-3">
					<span className="flex size-12 items-center justify-center rounded-2xl bg-link/15 text-link">
						<BellRingIcon className="size-6" />
					</span>
					<div>
						<h2 className="text-2xl font-bold">{t("title")}</h2>
						<p className="text-sm text-muted-foreground">
							{unreadCount > 0
								? t("unreadSummary", { count: unreadCount })
								: t("allCaughtUp")}
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					className="rounded-full"
					onClick={() => markAll.mutate()}
					disabled={unreadCount === 0 || markAll.isPending}
				>
					<CheckCheckIcon className="size-4" />
					{t("markAllRead")}
				</Button>
			</div>

			{list.isPending ? (
				<div className="overflow-hidden rounded-3xl border border-border bg-card">
					{[0, 1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
						>
							<Skeleton className="size-10 rounded-full" />
							<div className="flex flex-1 flex-col gap-2">
								<Skeleton className="h-3.5 w-3/4" />
								<Skeleton className="h-3 w-20" />
							</div>
						</div>
					))}
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
					<span className="flex size-16 items-center justify-center rounded-full bg-link/15 text-link">
						<BellIcon className="size-8" />
					</span>
					<p className="font-display text-xl font-semibold">
						{t("emptyTitle")}
					</p>
					<p className="max-w-xs text-sm text-muted-foreground">
						{t("emptySubtitle")}
					</p>
				</div>
			) : (
				<>
					{groups.map((g) => (
						<section key={g.key} className="space-y-2">
							<p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								{g.label}
							</p>
							<ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
								{g.items.map((n) => (
									<NotificationRow
										key={n.id}
										n={n}
										onOpen={() => open(n)}
										onMarkRead={() => markRead.mutate(n.id)}
										onDelete={() => remove.mutate(n.id)}
									/>
								))}
							</ul>
						</section>
					))}
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
