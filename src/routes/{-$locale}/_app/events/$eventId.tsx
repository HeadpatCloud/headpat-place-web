import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BellIcon, BellOffIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { EventLocationMap } from "@/components/map/EventLocationMap";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { useDateFormat } from "@/lib/datetime";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useTranslations,
} from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/events/$eventId")({
	component: EventDetailPage,
	loader: async ({ params }) => {
		if (typeof window !== "undefined") return null;
		try {
			const ev = await client.event.byId({ eventId: params.eventId });
			return { title: ev.title };
		} catch {
			return null;
		}
	},
	head: ({ params, loaderData }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		const eventId = (params as { locale?: Locale; eventId: string }).eventId;
		return seo({
			title: loaderData?.title ?? translate(locale, "eventsPages.seoTitle"),
			path: `/events/${eventId}`,
			locale,
		});
	},
});

function EventDetailPage() {
	const t = useTranslations("eventsPages");
	const c = useTranslations("common");
	const { eventId } = Route.useParams();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const fmt = useDateFormat();
	const { data: session } = useSession();
	const event = useQuery(orpc.event.byId.queryOptions({ input: { eventId } }));
	const myAttending = useQuery(
		orpc.event.myAttending.queryOptions({ input: undefined }),
	);

	const remove = useMutation({
		mutationFn: async () => client.event.delete({ eventId }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: orpc.event.list.key() });
			qc.invalidateQueries({ queryKey: orpc.event.mapList.key() });
			toast.success(t("eventDeleted"));
			navigate({ to: "/events" as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const myRow = (myAttending.data ?? []).find((a) => a.eventId === eventId);
	const isAttending = !!myRow;
	const notifyOn = myRow?.notify ?? false;

	const toggle = useMutation({
		mutationFn: async () => {
			if (isAttending) return client.event.unattend({ eventId });
			return client.event.attend({ eventId });
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: orpc.event.myAttending.queryKey({ input: undefined }),
			});
			qc.invalidateQueries({
				queryKey: orpc.event.byId.queryKey({ input: { eventId } }),
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const setNotify = useMutation({
		mutationFn: async () =>
			client.event.setNotify({ eventId, notify: !notifyOn }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: orpc.event.myAttending.queryKey({ input: undefined }),
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (event.isPending)
		return <p className="p-4 text-muted-foreground">{c("loading")}</p>;
	if (event.isError || !event.data)
		return <p className="p-4">{t("notFound")}</p>;
	const e = event.data;
	const isPast = new Date(e.endsAt ?? e.startsAt).getTime() < Date.now();
	const attendWord = isPast ? t("attendedWord") : t("attendingWord");
	const isOwner = !!session?.user && session.user.id === e.creatorUserId;
	const hasZone =
		(e.locationZoneMethod === "circle" || e.locationZoneMethod === "polygon") &&
		(e.coordinates ?? []).length > 0;

	return (
		<main className="space-y-6">
			<div className="bg-sunset-hero rounded-2xl p-8 text-white space-y-2">
				<div className="flex items-start justify-between gap-3">
					<h1 className="text-2xl sm:text-3xl font-extrabold">{e.title}</h1>
					{isOwner ? (
						<div className="flex shrink-0 gap-2">
							<Button
								asChild
								variant="secondary"
								size="sm"
								className="bg-white/15 text-white hover:bg-white/25"
							>
								<Link
									to={"/events/$eventId/edit" as never}
									params={{ eventId } as never}
								>
									<PencilIcon className="size-4" />
									{t("edit")}
								</Link>
							</Button>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="secondary"
										size="sm"
										className="bg-white/15 text-white hover:bg-white/25"
									>
										<Trash2Icon className="size-4" />
										{c("delete")}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t("deleteConfirmTitle")}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t("deleteConfirmBody")}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => remove.mutate()}
											disabled={remove.isPending}
											className="bg-destructive text-white hover:bg-destructive/90"
										>
											{c("delete")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					) : null}
				</div>
				<p className="text-sm opacity-90">
					{fmt.dateTime(e.startsAt)}
					{e.endsAt ? ` - ${fmt.dateTime(e.endsAt)}` : ""}
				</p>
				{e.locationText ? (
					<p className="text-sm opacity-90">{e.locationText}</p>
				) : null}
			</div>

			{hasZone ? (
				<EventLocationMap
					method={e.locationZoneMethod}
					coordinates={e.coordinates ?? []}
					circleRadius={e.circleRadius}
				/>
			) : null}

			<Card>
				<CardContent className="space-y-4 pt-6">
					<div className="flex gap-2 flex-wrap">
						{(e.tags ?? []).map((t) => (
							<Badge key={t} variant="secondary">
								{t}
							</Badge>
						))}
						{e.isPaid ? <Badge variant="default">{t("paid")}</Badge> : null}
					</div>
					{e.label ? <p className="text-muted-foreground">{e.label}</p> : null}
					{e.description ? <p>{e.description}</p> : null}
					{e.website ? (
						<p className="text-sm">
							<a href={e.website} className="text-link hover:underline">
								{t("website")}
							</a>
						</p>
					) : null}
					{isPast && !isAttending ? (
						<Button disabled variant="outline">
							{t("eventEnded")}
						</Button>
					) : (
						<div className="flex items-center gap-2">
							<Button
								onClick={() => toggle.mutate()}
								disabled={toggle.isPending}
								className={
									isAttending
										? undefined
										: "bg-primary text-primary-foreground hover:bg-primary/90"
								}
								variant={isAttending ? "outline" : "default"}
							>
								{isAttending ? t("attendingCancel") : t("attend")}
							</Button>
							{isAttending && !isPast ? (
								<Button
									variant="outline"
									size="icon"
									disabled={setNotify.isPending}
									onClick={() => setNotify.mutate()}
									title={notifyOn ? t("reminderOn") : t("reminderOff")}
									className={
										notifyOn ? "text-primary" : "text-muted-foreground"
									}
								>
									{notifyOn ? (
										<BellIcon className="size-4" />
									) : (
										<BellOffIcon className="size-4" />
									)}
								</Button>
							) : null}
						</div>
					)}
					{e.visitorCapacity ? (
						<div className="space-y-1">
							<div className="h-2 w-full rounded-full bg-muted">
								<div
									className="h-2 rounded-full bg-primary"
									style={{
										width: `${Math.min(100, Math.round((e.attendeesCount / e.visitorCapacity) * 100))}%`,
									}}
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								{t("attendeesWithCapacity", {
									count: e.attendeesCount,
									capacity: e.visitorCapacity,
									word: attendWord,
								})}
							</p>
						</div>
					) : (
						<p className="text-xs text-muted-foreground">
							{t("attendeesCount", {
								count: e.attendeesCount,
								word: attendWord,
							})}
						</p>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
