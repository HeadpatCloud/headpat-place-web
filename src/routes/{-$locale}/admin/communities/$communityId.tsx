import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CrownIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPage, Empty, Panel } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { parseTags, SwitchRow } from "@/components/admin/fields";
import { ReasonConfirm } from "@/components/admin/ReasonConfirm";
import { useStepUp } from "@/components/admin/StepUp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isStepUpCancelled, useAdminAccess } from "@/lib/admin-access";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute(
	"/{-$locale}/admin/communities/$communityId",
)({
	component: CommunityDetail,
});

type Community = Awaited<ReturnType<typeof client.adminCommunity.get>>;

function CommunityDetail() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const navigate = useNavigate();
	const { can } = useAdminAccess();
	const { communityId: id } = Route.useParams();
	const q = useQuery(orpc.adminCommunity.get.queryOptions({ input: { id } }));
	const del = useMutation({
		mutationFn: (reason: string) =>
			client.adminContent.communityDelete({ id, reason }),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			navigate({ to: "/admin/communities" as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (q.isPending) return <Empty>{c("loading")}</Empty>;
	if (q.isError || !q.data) return <Empty>{t("noAccess")}</Empty>;
	const cm = q.data;

	return (
		<AdminPage
			title={cm.name}
			description={`/${cm.slug} · ${t("followersCount", { count: cm.followersCount })} · ${t("communityEvents", { count: cm.eventCount })} · ${t("communityReports", { count: cm.reportCount })}`}
			actions={
				<div className="flex gap-2">
					<Button asChild variant="outline" size="sm">
						<Link to={`/community/${cm.id}` as never}>{t("viewPublic")}</Link>
					</Button>
					{can("communities:delete") ? (
						<ConfirmDelete
							name={cm.name}
							typeToConfirm
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
				{can("communities:edit") ? <CommunityForm cm={cm} /> : null}
				<MembersPanel cm={cm} />
			</div>
			<ChannelsPanel cm={cm} />
		</AdminPage>
	);
}

function CommunityForm({ cm }: { cm: Community }) {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const [name, setName] = useState(cm.name);
	const [slug, setSlug] = useState(cm.slug);
	const [description, setDescription] = useState(cm.description ?? "");
	const [tags, setTags] = useState(cm.tags.join(", "));
	const [status, setStatus] = useState(
		cm.status === "archived" ? "archived" : "active",
	);
	const [findable, setFindable] = useState(cm.settings.isFindable);
	const [publicPage, setPublicPage] = useState(cm.settings.hasPublicPage);
	const [nsfw, setNsfw] = useState(cm.settings.nsfw);
	const [removeAvatar, setRemoveAvatar] = useState(false);
	const [removeBanner, setRemoveBanner] = useState(false);
	const [reason, setReason] = useState("");
	useEffect(() => {
		setName(cm.name);
		setSlug(cm.slug);
		setDescription(cm.description ?? "");
		setTags(cm.tags.join(", "));
		setFindable(cm.settings.isFindable);
		setPublicPage(cm.settings.hasPublicPage);
		setNsfw(cm.settings.nsfw);
	}, [cm]);

	const save = useMutation({
		mutationFn: () =>
			client.adminCommunity.update({
				id: cm.id,
				name: name.trim(),
				slug: slug.trim(),
				description: description.trim() || null,
				tags: parseTags(tags),
				status: status as "active" | "archived",
				isFindable: findable,
				hasPublicPage: publicPage,
				nsfw,
				...(removeAvatar ? { removeAvatar } : {}),
				...(removeBanner ? { removeBanner } : {}),
				reason: reason.trim() || undefined,
			}),
		onSuccess: (r) => {
			toast.success(
				r.changed.length
					? t("profileSaved", { count: r.changed.length })
					: t("nothingChanged"),
			);
			setReason("");
			setRemoveAvatar(false);
			setRemoveBanner(false);
			qc.invalidateQueries({ queryKey: orpc.adminCommunity.get.key() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function submit(e: FormEvent) {
		e.preventDefault();
		save.mutate();
	}

	return (
		<Panel title={t("communityEdit")}>
			<form onSubmit={submit} className="space-y-3">
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="cm-name">{t("communityName")}</Label>
						<Input
							id="cm-name"
							value={name}
							maxLength={120}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="cm-slug">{t("communitySlug")}</Label>
						<Input
							id="cm-slug"
							value={slug}
							maxLength={120}
							onChange={(e) => setSlug(e.target.value)}
						/>
					</div>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="cm-desc">{t("galleryDescription")}</Label>
					<Textarea
						id="cm-desc"
						rows={3}
						maxLength={2000}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="space-y-1.5">
						<Label htmlFor="cm-tags">{t("galleryTags")}</Label>
						<Input
							id="cm-tags"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>{t("communityStatus")}</Label>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">{t("communityActive")}</SelectItem>
								<SelectItem value="archived">
									{t("communityArchived")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="grid gap-2 sm:grid-cols-2">
					<SwitchRow
						id="cm-findable"
						label={t("communityFindable")}
						checked={findable}
						onChange={setFindable}
					/>
					<SwitchRow
						id="cm-public"
						label={t("communityPublicPage")}
						checked={publicPage}
						onChange={setPublicPage}
					/>
					<SwitchRow
						id="cm-nsfw"
						label={t("galleryNsfw")}
						checked={nsfw}
						onChange={setNsfw}
					/>
					{cm.avatarFileId ? (
						<SwitchRow
							id="cm-rm-avatar"
							label={t("removeAvatar")}
							checked={removeAvatar}
							onChange={setRemoveAvatar}
						/>
					) : null}
					{cm.bannerFileId ? (
						<SwitchRow
							id="cm-rm-banner"
							label={t("removeBanner")}
							checked={removeBanner}
							onChange={setRemoveBanner}
						/>
					) : null}
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="cm-reason">{t("reasonOptionalLabel")}</Label>
					<Input
						id="cm-reason"
						value={reason}
						maxLength={500}
						onChange={(e) => setReason(e.target.value)}
					/>
				</div>
				<Button
					type="submit"
					disabled={save.isPending || !name.trim() || !slug.trim()}
					className="bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{t("save")}
				</Button>
			</form>
		</Panel>
	);
}

function MembersPanel({ cm }: { cm: Community }) {
	const t = useTranslations("adminPanel");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const { can } = useAdminAccess();
	const { withStepUp } = useStepUp();
	const canMembers = can("communities:members");
	const refresh = () =>
		qc.invalidateQueries({ queryKey: orpc.adminCommunity.get.key() });
	const setRole = useMutation({
		mutationFn: (v: { userId: string; role: "admin" | "moderator" | null }) =>
			client.adminCommunity.setRole({ communityId: cm.id, ...v }),
		onSuccess: refresh,
		onError: (e: Error) => toast.error(e.message),
	});
	const transfer = useMutation({
		mutationFn: (v: { newOwnerUserId: string; reason: string }) =>
			withStepUp(() =>
				client.adminCommunity.transferOwnership({ communityId: cm.id, ...v }),
			),
		onSuccess: () => {
			toast.success(t("ownerChanged"));
			refresh();
		},
		onError: (e: Error) => {
			if (!isStepUpCancelled(e)) toast.error(e.message);
		},
	});

	return (
		<Panel title={t("communityTeam", { count: cm.members.length })}>
			{cm.members.length === 0 ? (
				<p className="text-sm text-muted-foreground">{t("communityNoTeam")}</p>
			) : (
				<div className="space-y-2">
					{cm.members.map((m) => (
						<div
							key={m.userId}
							className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-2.5"
						>
							<div className="min-w-0">
								<Link
									to={`/admin/users/${m.userId}` as never}
									className="font-semibold hover:underline"
								>
									{m.displayName || m.name}
								</Link>
								<p className="text-xs text-muted-foreground">
									{t("communitySince", { date: fmt.date(m.since) })}
								</p>
							</div>
							{m.role === "owner" || !canMembers ? (
								<Badge variant={m.role === "owner" ? "default" : "secondary"}>
									{t(`communityRole_${m.role}`)}
								</Badge>
							) : (
								<div className="flex items-center gap-1.5">
									<Select
										value={m.role}
										onValueChange={(v) =>
											setRole.mutate({
												userId: m.userId,
												role:
													v === "none" ? null : (v as "admin" | "moderator"),
											})
										}
									>
										<SelectTrigger
											className="h-8 w-36"
											aria-label={t("communityRoleLabel")}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="admin">
												{t("communityRole_admin")}
											</SelectItem>
											<SelectItem value="moderator">
												{t("communityRole_moderator")}
											</SelectItem>
											<SelectItem value="none">
												{t("communityRoleRemove")}
											</SelectItem>
										</SelectContent>
									</Select>
									<ReasonConfirm
										title={t("makeOwnerTitle", {
											name: m.displayName || m.name,
										})}
										body={t("makeOwnerBody")}
										confirmLabel={t("makeOwner")}
										onConfirm={(reason) =>
											transfer.mutate({ newOwnerUserId: m.userId, reason })
										}
										trigger={
											<Button
												variant="ghost"
												size="sm"
												aria-label={t("makeOwner")}
												title={t("makeOwner")}
											>
												<CrownIcon className="size-4" />
											</Button>
										}
									/>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</Panel>
	);
}

function ChannelsPanel({ cm }: { cm: Community }) {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const { can } = useAdminAccess();
	const [editing, setEditing] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [topic, setTopic] = useState("");
	const refresh = () =>
		qc.invalidateQueries({ queryKey: orpc.adminCommunity.get.key() });
	const save = useMutation({
		mutationFn: (id: string) =>
			client.adminCommunity.channelUpdate({
				id,
				name: name.trim(),
				topic: topic.trim() || null,
			}),
		onSuccess: () => {
			setEditing(null);
			refresh();
		},
		onError: (e: Error) => toast.error(e.message),
	});
	const del = useMutation({
		mutationFn: (v: { id: string; reason: string }) =>
			client.adminCommunity.channelDelete(v),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			refresh();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<Panel title={t("communityChannels", { count: cm.channels.length })}>
			{cm.channels.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					{t("communityNoChannels")}
				</p>
			) : (
				<div className="space-y-2">
					{cm.channels.map((ch) =>
						editing === ch.id ? (
							<form
								key={ch.id}
								className="flex flex-wrap gap-2 rounded-xl border border-border p-2.5"
								onSubmit={(e) => {
									e.preventDefault();
									save.mutate(ch.id);
								}}
							>
								<Input
									aria-label={t("channelName")}
									value={name}
									maxLength={80}
									onChange={(e) => setName(e.target.value)}
									className="w-48"
								/>
								<Input
									aria-label={t("channelTopic")}
									placeholder={t("channelTopic")}
									value={topic}
									maxLength={500}
									onChange={(e) => setTopic(e.target.value)}
									className="min-w-48 flex-1"
								/>
								<Button
									type="submit"
									size="sm"
									disabled={save.isPending || !name.trim()}
									className="bg-primary text-primary-foreground hover:bg-primary/90"
								>
									{t("save")}
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={() => setEditing(null)}
								>
									{t("cancel")}
								</Button>
							</form>
						) : (
							<div
								key={ch.id}
								className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5"
							>
								<div className="min-w-0">
									<p className="font-semibold"># {ch.name}</p>
									{ch.topic ? (
										<p className="truncate text-xs text-muted-foreground">
											{ch.topic}
										</p>
									) : null}
								</div>
								<div className="flex shrink-0 gap-1">
									{can("channels:edit") ? (
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												setEditing(ch.id);
												setName(ch.name);
												setTopic(ch.topic ?? "");
											}}
										>
											{t("edit")}
										</Button>
									) : null}
									{can("channels:delete") ? (
										<ConfirmDelete
											name={`#${ch.name}`}
											onConfirm={(reason) => del.mutate({ id: ch.id, reason })}
										/>
									) : null}
								</div>
							</div>
						),
					)}
				</div>
			)}
		</Panel>
	);
}
