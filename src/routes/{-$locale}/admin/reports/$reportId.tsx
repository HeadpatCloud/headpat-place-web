import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPage, Empty, Panel } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { ReasonConfirm } from "@/components/admin/ReasonConfirm";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { StorageImage } from "@/components/StorageImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAccess } from "@/lib/admin-access";
import { useSession } from "@/lib/auth-client";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/{-$locale}/admin/reports/$reportId")({
	component: ReportDetail,
});

type Report = Awaited<ReturnType<typeof client.adminReport.get>>;
type Status = "open" | "reviewing" | "resolved" | "dismissed";

function ReportDetail() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const { reportId } = Route.useParams();
	const q = useQuery(
		orpc.adminReport.get.queryOptions({ input: { reportId } }),
	);

	if (q.isPending) return <Empty>{c("loading")}</Empty>;
	if (q.isError || !q.data) return <Empty>{t("noAccess")}</Empty>;
	const r = q.data;

	return (
		<AdminPage
			title={`${t(`targetType_${r.targetType}`)}: ${targetLabel(r) ?? t("targetGone")}`}
			description={t("reportedOn", { date: fmt.dateTime(r.createdAt) })}
			actions={<Badge>{t(`status_${r.status}`)}</Badge>}
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<div className="space-y-4">
					<Panel title={t("reportReason")}>
						<p className="whitespace-pre-wrap">{r.reason}</p>
						<p className="mt-3 text-sm text-muted-foreground">
							{t("reportBy")}:{" "}
							<Link
								to={`/admin/users/${r.reporter.userId}` as never}
								className="font-semibold hover:underline"
							>
								{r.reporter.name ?? r.reporter.userId}
							</Link>
						</p>
					</Panel>
					<TargetPanel r={r} />
					{r.otherReports.length ? (
						<Panel title={t("otherReports", { count: r.otherReports.length })}>
							<div className="space-y-1.5">
								{r.otherReports.map((o) => (
									<Link
										key={o.id}
										to={`/admin/reports/${o.id}` as never}
										className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/40"
									>
										<span className="min-w-0 truncate">{o.reason}</span>
										<span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
											{fmt.date(o.createdAt)}
											<Badge variant="secondary">
												{t(`status_${o.status}`)}
											</Badge>
										</span>
									</Link>
								))}
							</div>
						</Panel>
					) : null}
				</div>
				<HandlingPanel r={r} />
			</div>
		</AdminPage>
	);
}

function targetLabel(r: Report): string | null {
	const x = r.target;
	if (!x) return null;
	switch (x.type) {
		case "user":
			return x.displayName || x.name;
		case "gallery":
		case "community":
			return x.name;
		case "event":
			return x.title;
		case "announcement":
			return x.title ?? "";
		case "message":
			return x.senderName ?? "";
	}
}

function TargetPanel({ r }: { r: Report }) {
	const t = useTranslations("adminPanel");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const { can } = useAdminAccess();
	const [showMessages, setShowMessages] = useState(false);
	const msgs = useQuery({
		...orpc.adminReport.messageContext.queryOptions({
			input: { reportId: r.id },
		}),
		enabled: showMessages,
	});
	const refresh = () =>
		qc.invalidateQueries({ queryKey: orpc.adminReport.get.key() });
	const removed = () => {
		toast.success(t("deletedToast"));
		refresh();
	};
	const onError = (e: Error) => toast.error(e.message);

	const delGallery = useMutation({
		mutationFn: (v: { id: string; reason: string }) =>
			client.adminContent.galleryDelete(v),
		onSuccess: removed,
		onError,
	});
	const delMessage = useMutation({
		mutationFn: (v: { messageId: string; reason: string }) =>
			client.adminContent.messageDelete(v),
		onSuccess: () => {
			removed();
			qc.invalidateQueries({ queryKey: orpc.adminReport.messageContext.key() });
		},
		onError,
	});
	const delCommunity = useMutation({
		mutationFn: (v: { id: string; reason: string }) =>
			client.adminContent.communityDelete(v),
		onSuccess: removed,
		onError,
	});
	const delEvent = useMutation({
		mutationFn: (v: { id: string; reason: string }) =>
			client.adminContent.eventDelete(v),
		onSuccess: removed,
		onError,
	});

	const x = r.target;
	return (
		<Panel title={t("reportedContent")}>
			{!x ? (
				<p className="text-sm text-muted-foreground">{t("targetGoneLong")}</p>
			) : x.type === "user" ? (
				<div className="flex items-center gap-4">
					<StorageImage
						kind="avatar"
						fileId={x.avatarFileId}
						variant="sm"
						className="size-14 rounded-xl object-cover"
						fallback={<div className="size-14 rounded-xl bg-muted" />}
					/>
					<div className="min-w-0 flex-1">
						<p className="font-semibold">
							{x.displayName || x.name}{" "}
							{x.banned ? (
								<Badge variant="destructive">{t("bannedBadge")}</Badge>
							) : null}
						</p>
						<p className="text-sm text-muted-foreground">@{x.profileUrl}</p>
						{x.bio ? (
							<p className="mt-1 line-clamp-3 text-sm">{x.bio}</p>
						) : null}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							navigate({ to: `/admin/users/${x.userId}` as never })
						}
					>
						{t("openUser")}
					</Button>
				</div>
			) : x.type === "gallery" ? (
				<div className="flex flex-wrap items-start gap-4">
					<Link
						to={`/admin/gallery/${x.id}` as never}
						className="size-40 shrink-0 overflow-hidden rounded-2xl bg-muted"
					>
						<ResponsiveImage
							kind="gallery"
							fileId={x.fileId}
							alt={x.name}
							sizes="160px"
							className="size-full object-cover"
						/>
					</Link>
					<div className="min-w-0 flex-1 space-y-2">
						<p className="font-semibold">
							{x.name}{" "}
							{x.nsfw ? <Badge variant="destructive">18+</Badge> : null}
						</p>
						<p className="text-sm text-muted-foreground">
							{t("ownedBy")}{" "}
							<Link
								to={`/admin/users/${x.ownerUserId}` as never}
								className="font-semibold hover:underline"
							>
								{x.ownerName}
							</Link>{" "}
							· {fmt.date(x.createdAt)}
						</p>
						{x.longText ? (
							<p className="line-clamp-4 text-sm">{x.longText}</p>
						) : null}
						<div className="flex flex-wrap gap-2">
							<Button asChild variant="outline" size="sm">
								<Link to={`/admin/gallery/${x.id}` as never}>
									{t("openGalleryItem")}
								</Link>
							</Button>
							{can("gallery:delete") ? (
								<ConfirmDelete
									name={x.name}
									onConfirm={(reason) =>
										delGallery.mutate({ id: x.id, reason })
									}
									trigger={
										<Button variant="destructive" size="sm">
											<Trash2Icon className="size-4" />
											{t("delete")}
										</Button>
									}
								/>
							) : null}
						</div>
					</div>
				</div>
			) : x.type === "message" ? (
				<div className="space-y-3">
					<p className="text-sm">
						{t("messageBy")}{" "}
						<Link
							to={`/admin/users/${x.senderUserId}` as never}
							className="font-semibold hover:underline"
						>
							{x.senderName ?? x.senderUserId}
						</Link>{" "}
						<span className="text-muted-foreground">
							· {t(`messageWhere_${x.where}`)} · {fmt.dateTime(x.createdAt)}
						</span>
					</p>
					<div className="flex flex-wrap gap-2">
						{can("messages:viewReported") && !showMessages ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowMessages(true)}
							>
								<MessageSquareIcon className="size-4" />
								{t("showMessages")}
							</Button>
						) : null}
						{can("messages:delete") ? (
							<ReasonConfirm
								title={t("deleteMessageTitle")}
								body={t("deleteMessageBody")}
								confirmLabel={t("delete")}
								destructive
								onConfirm={(reason) =>
									delMessage.mutate({ messageId: x.id, reason })
								}
								trigger={
									<Button variant="destructive" size="sm">
										<Trash2Icon className="size-4" />
										{t("deleteMessage")}
									</Button>
								}
							/>
						) : null}
					</div>
					{showMessages ? (
						<div className="space-y-1.5">
							<p className="text-xs text-muted-foreground">
								{t("showMessagesLogged")}
							</p>
							{msgs.isPending ? null : msgs.data?.deleted ? (
								<p className="text-sm text-muted-foreground">
									{t("targetGoneLong")}
								</p>
							) : (
								(msgs.data?.messages ?? []).map((m) => (
									<div
										key={m.id}
										className={cn(
											"rounded-xl border p-2.5 text-sm",
											m.reported
												? "border-destructive bg-destructive/10"
												: "border-border",
										)}
									>
										<p className="text-xs text-muted-foreground">
											<span className="font-semibold text-foreground">
												{m.senderName ?? m.senderUserId}
											</span>{" "}
											· {fmt.dateTime(m.createdAt)}
											{m.editedAt ? ` · ${t("messageEdited")}` : ""}
										</p>
										<p className="whitespace-pre-wrap">
											{m.messageType === "text" ? m.body : `[${m.messageType}]`}
										</p>
										{m.attachments.length ? (
											<p className="text-xs text-muted-foreground">
												{t("messageAttachments", {
													count: m.attachments.length,
												})}
											</p>
										) : null}
									</div>
								))
							)}
						</div>
					) : null}
				</div>
			) : x.type === "community" ? (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="font-semibold">{x.name}</p>
						<p className="text-sm text-muted-foreground">
							/{x.slug} · {t("followersCount", { count: x.followersCount })}
						</p>
					</div>
					{can("communities:delete") ? (
						<ConfirmDelete
							name={x.name}
							typeToConfirm
							onConfirm={(reason) => delCommunity.mutate({ id: x.id, reason })}
							trigger={
								<Button variant="destructive" size="sm">
									<Trash2Icon className="size-4" />
									{t("delete")}
								</Button>
							}
						/>
					) : null}
				</div>
			) : x.type === "event" ? (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<Link
							to={`/events/${x.id}` as never}
							className="font-semibold hover:underline"
						>
							{x.title}
						</Link>
						<p className="text-sm text-muted-foreground">
							{fmt.dateTime(x.startsAt)}
							{x.locationText ? ` · ${x.locationText}` : ""}
						</p>
					</div>
					{can("events:delete") ? (
						<ConfirmDelete
							name={x.title}
							onConfirm={(reason) => delEvent.mutate({ id: x.id, reason })}
							trigger={
								<Button variant="destructive" size="sm">
									<Trash2Icon className="size-4" />
									{t("delete")}
								</Button>
							}
						/>
					) : null}
				</div>
			) : (
				<Link
					to={`/admin/announcements/${x.id}` as never}
					className="font-semibold hover:underline"
				>
					{x.title ?? x.id}
				</Link>
			)}
		</Panel>
	);
}

function HandlingPanel({ r }: { r: Report }) {
	const t = useTranslations("adminPanel");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const { can } = useAdminAccess();
	const { data: session } = useSession();
	const me = session?.user?.id;
	const [status, setStatus] = useState<Status>(r.status as Status);
	const [note, setNote] = useState(r.resolutionNote ?? "");
	useEffect(() => {
		setStatus(r.status as Status);
		setNote(r.resolutionNote ?? "");
	}, [r.status, r.resolutionNote]);
	const refresh = () => {
		qc.invalidateQueries({ queryKey: orpc.adminReport.get.key() });
		qc.invalidateQueries({ queryKey: orpc.adminReport.list.key() });
	};
	const assign = useMutation({
		mutationFn: (assigneeUserId: string | null) =>
			client.adminReport.assign({ reportId: r.id, assigneeUserId }),
		onSuccess: refresh,
		onError: (e: Error) => toast.error(e.message),
	});
	const resolve = useMutation({
		mutationFn: () =>
			client.adminReport.resolve({
				reportId: r.id,
				status,
				note: note.trim() || undefined,
			}),
		onSuccess: () => {
			toast.success(t("saved"));
			refresh();
		},
		onError: (e: Error) => toast.error(e.message),
	});
	const closing = status === "resolved" || status === "dismissed";

	return (
		<Panel title={t("handling")}>
			<div className="space-y-4">
				<div className="space-y-1.5">
					<p className="text-sm text-muted-foreground">{t("reportAssignee")}</p>
					<p className="font-semibold">
						{r.assigneeName ?? t("assignedNobody")}
					</p>
					{can("reports:assign") ? (
						<div className="flex gap-2">
							{me && r.assignedToUserId !== me ? (
								<Button
									size="sm"
									variant="outline"
									disabled={assign.isPending}
									onClick={() => assign.mutate(me)}
								>
									{t("assignToMe")}
								</Button>
							) : null}
							{r.assignedToUserId ? (
								<Button
									size="sm"
									variant="ghost"
									disabled={assign.isPending}
									onClick={() => assign.mutate(null)}
								>
									{t("unassign")}
								</Button>
							) : null}
						</div>
					) : null}
				</div>

				{r.resolvedAt ? (
					<p className="text-sm text-muted-foreground">
						{t("closedBy", {
							name: r.resolverName ?? "-",
							date: fmt.dateTime(r.resolvedAt),
						})}
					</p>
				) : null}

				{can("reports:resolve") ? (
					<div className="space-y-2">
						<Label>{t("reportStatus")}</Label>
						<Select
							value={status}
							onValueChange={(v) => setStatus(v as Status)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(["open", "reviewing", "resolved", "dismissed"] as const).map(
									(s) => (
										<SelectItem key={s} value={s}>
											{t(`status_${s}`)}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
						<Label htmlFor="report-note">
							{closing ? t("resolutionNote") : t("resolutionNoteOptional")}
						</Label>
						<Textarea
							id="report-note"
							rows={3}
							maxLength={2000}
							value={note}
							onChange={(e) => setNote(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">{t("reasonHint")}</p>
						<Button
							className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
							disabled={resolve.isPending || (closing && !note.trim())}
							onClick={() => resolve.mutate()}
						>
							{t("save")}
						</Button>
					</div>
				) : r.resolutionNote ? (
					<p className="whitespace-pre-wrap text-sm">{r.resolutionNote}</p>
				) : null}
			</div>
		</Panel>
	);
}
