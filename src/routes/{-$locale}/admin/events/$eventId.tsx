import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2Icon, UserMinusIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPage, Empty, Panel } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { parseTags, SwitchRow, toLocalInput } from "@/components/admin/fields";
import { ReasonConfirm } from "@/components/admin/ReasonConfirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAccess } from "@/lib/admin-access";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/events/$eventId")({
	component: EventDetail,
});

type AdminEvent = Awaited<ReturnType<typeof client.adminEvent.get>>;

function EventDetail() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const navigate = useNavigate();
	const { can } = useAdminAccess();
	const { eventId: id } = Route.useParams();
	const q = useQuery(orpc.adminEvent.get.queryOptions({ input: { id } }));
	const del = useMutation({
		mutationFn: (reason: string) =>
			client.adminContent.eventDelete({ id, reason }),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			navigate({ to: "/admin/events" as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (q.isPending) return <Empty>{c("loading")}</Empty>;
	if (q.isError || !q.data) return <Empty>{t("noAccess")}</Empty>;
	const ev = q.data;

	return (
		<AdminPage
			title={ev.title}
			description={`${fmt.dateTime(ev.startsAt)}${ev.communityName ? ` · ${ev.communityName}` : ""}${ev.creatorName ? ` · ${t("hostedBy", { name: ev.creatorName })}` : ""}`}
			actions={
				<div className="flex gap-2">
					<Button asChild variant="outline" size="sm">
						<Link to={`/events/${ev.id}` as never}>{t("viewPublic")}</Link>
					</Button>
					{can("events:delete") ? (
						<ConfirmDelete
							name={ev.title}
							onConfirm={(r) => del.mutate(r)}
							trigger={
								<Button variant="destructive" size="sm">
									<Trash2Icon className="size-4" />
									{t("delete")}
								</Button>
							}
						/>
					) : null}
				</div>
			}
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
				{can("events:edit") ? <EventForm ev={ev} /> : null}
				<AttendeesPanel ev={ev} />
			</div>
		</AdminPage>
	);
}

function formValues(ev: AdminEvent) {
	return {
		title: ev.title,
		label: ev.label ?? "",
		description: ev.description ?? "",
		startsAt: toLocalInput(ev.startsAt),
		endsAt: toLocalInput(ev.endsAt),
		locationText: ev.locationText ?? "",
		website: ev.website ?? "",
		capacity: ev.visitorCapacity ? String(ev.visitorCapacity) : "",
		tags: ev.tags.join(", "),
	};
}

function EventForm({ ev }: { ev: AdminEvent }) {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const [v, setV] = useState(() => formValues(ev));
	const [isPublic, setIsPublic] = useState(ev.isPublic);
	const [reason, setReason] = useState("");
	useEffect(() => {
		setV(formValues(ev));
		setIsPublic(ev.isPublic);
	}, [ev]);
	const field = (k: keyof ReturnType<typeof formValues>) => ({
		id: `ev-${k}`,
		value: v[k],
		onChange: (e: { target: { value: string } }) =>
			setV((s) => ({ ...s, [k]: e.target.value })),
	});

	const save = useMutation({
		mutationFn: () =>
			client.adminEvent.update({
				id: ev.id,
				title: v.title.trim(),
				label: v.label.trim() || null,
				description: v.description.trim() || null,
				startsAt: new Date(v.startsAt),
				endsAt: v.endsAt ? new Date(v.endsAt) : null,
				locationText: v.locationText.trim() || null,
				website: v.website.trim() || null,
				visitorCapacity: v.capacity ? Number(v.capacity) : null,
				tags: parseTags(v.tags),
				isPublic,
				reason: reason.trim() || undefined,
			}),
		onSuccess: (r) => {
			toast.success(
				r.changed.length
					? t("profileSaved", { count: r.changed.length })
					: t("nothingChanged"),
			);
			setReason("");
			qc.invalidateQueries({ queryKey: orpc.adminEvent.get.key() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function submit(e: FormEvent) {
		e.preventDefault();
		save.mutate();
	}

	return (
		<Panel title={t("eventEdit")}>
			<form onSubmit={submit} className="space-y-3">
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="ev-title">{t("galleryTitleLabel")}</Label>
						<Input maxLength={200} {...field("title")} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ev-label">{t("eventLabel")}</Label>
						<Input maxLength={200} {...field("label")} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ev-startsAt">{t("eventStarts")}</Label>
						<Input type="datetime-local" {...field("startsAt")} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ev-endsAt">{t("eventEnds")}</Label>
						<Input type="datetime-local" {...field("endsAt")} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ev-locationText">{t("location")}</Label>
						<Input maxLength={200} {...field("locationText")} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ev-website">{t("eventWebsite")}</Label>
						<Input type="url" maxLength={500} {...field("website")} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ev-capacity">{t("eventCapacity")}</Label>
						<Input type="number" min={1} {...field("capacity")} />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ev-tags">{t("galleryTags")}</Label>
						<Input {...field("tags")} />
					</div>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="ev-description">{t("galleryDescription")}</Label>
					<Textarea rows={4} maxLength={10000} {...field("description")} />
				</div>
				<SwitchRow
					id="ev-public"
					label={t("eventPublic")}
					checked={isPublic}
					onChange={setIsPublic}
				/>
				<div className="space-y-1.5">
					<Label htmlFor="ev-reason">{t("reasonOptionalLabel")}</Label>
					<Input
						id="ev-reason"
						value={reason}
						maxLength={500}
						onChange={(e) => setReason(e.target.value)}
					/>
				</div>
				<Button
					type="submit"
					disabled={save.isPending || !v.title.trim() || !v.startsAt}
					className="bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{t("save")}
				</Button>
			</form>
		</Panel>
	);
}

function AttendeesPanel({ ev }: { ev: AdminEvent }) {
	const t = useTranslations("adminPanel");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const { can } = useAdminAccess();
	const remove = useMutation({
		mutationFn: (v: { userId: string; reason: string }) =>
			client.adminEvent.removeAttendee({ eventId: ev.id, ...v }),
		onSuccess: () => {
			toast.success(t("attendeeRemoved"));
			qc.invalidateQueries({ queryKey: orpc.adminEvent.get.key() });
		},
		onError: (e: Error) => toast.error(e.message),
	});
	return (
		<Panel title={t("eventAttendees", { count: ev.attendeesCount })}>
			{ev.attendees.length === 0 ? (
				<p className="text-sm text-muted-foreground">{t("eventNoAttendees")}</p>
			) : (
				<div className="space-y-2">
					{ev.attendees.map((a) => (
						<div
							key={a.userId}
							className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5"
						>
							<div className="min-w-0">
								<Link
									to={`/admin/users/${a.userId}` as never}
									className="font-semibold hover:underline"
								>
									{a.displayName || a.name}
								</Link>
								<p className="text-xs text-muted-foreground">
									{t("attendingSince", { date: fmt.date(a.since) })}
								</p>
							</div>
							{can("events:attendees") ? (
								<ReasonConfirm
									title={t("removeAttendeeTitle", {
										name: a.displayName || a.name,
									})}
									confirmLabel={t("removeAttendee")}
									destructive
									onConfirm={(reason) =>
										remove.mutate({ userId: a.userId, reason })
									}
									trigger={
										<Button
											variant="ghost"
											size="sm"
											aria-label={t("removeAttendee")}
											title={t("removeAttendee")}
										>
											<UserMinusIcon className="size-4" />
										</Button>
									}
								/>
							) : null}
						</div>
					))}
				</div>
			)}
		</Panel>
	);
}
