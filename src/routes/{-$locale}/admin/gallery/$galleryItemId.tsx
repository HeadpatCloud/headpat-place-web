import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2Icon, XIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminPage, Empty, Panel } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { ReasonConfirm } from "@/components/admin/ReasonConfirm";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAccess } from "@/lib/admin-access";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute(
	"/{-$locale}/admin/gallery/$galleryItemId",
)({
	component: GalleryDetail,
});

function GalleryDetail() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const { can } = useAdminAccess();
	const { galleryItemId: id } = Route.useParams();
	const q = useQuery(
		orpc.adminContent.galleryGet.queryOptions({ input: { id } }),
	);

	const [name, setName] = useState("");
	const [longText, setLongText] = useState("");
	const [tags, setTags] = useState("");
	const [nsfw, setNsfw] = useState(false);
	const [reason, setReason] = useState("");
	useEffect(() => {
		if (q.data) {
			setName(q.data.name);
			setLongText(q.data.longText ?? "");
			setTags(q.data.tags.join(", "));
			setNsfw(q.data.nsfw);
		}
	}, [q.data]);

	const refresh = () =>
		qc.invalidateQueries({
			queryKey: orpc.adminContent.galleryGet.queryKey({ input: { id } }),
		});
	const save = useMutation({
		mutationFn: () =>
			client.adminContent.galleryUpdate({
				id,
				name: name.trim(),
				longText: longText.trim() || null,
				nsfw,
				tags: tags
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
				reason: reason.trim() || undefined,
			}),
		onSuccess: (r) => {
			toast.success(
				r.changed.length
					? t("profileSaved", { count: r.changed.length })
					: t("nothingChanged"),
			);
			setReason("");
			refresh();
		},
		onError: (e: Error) => toast.error(e.message),
	});
	const delComment = useMutation({
		mutationFn: (v: { commentId: string; reason: string }) =>
			client.adminContent.galleryCommentDelete(v),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			refresh();
		},
		onError: (e: Error) => toast.error(e.message),
	});
	const delItem = useMutation({
		mutationFn: (reason: string) =>
			client.adminContent.galleryDelete({ id, reason }),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			navigate({ to: "/admin/gallery" as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (q.isPending) return <Empty>{c("loading")}</Empty>;
	if (q.isError || !q.data) return <Empty>{t("noAccess")}</Empty>;
	const g = q.data;

	function submit(e: FormEvent) {
		e.preventDefault();
		save.mutate();
	}

	return (
		<AdminPage
			title={g.name}
			description={t("galleryUploadedBy", {
				name: g.ownerName,
				date: fmt.dateTime(g.createdAt),
			})}
			actions={
				can("gallery:delete") ? (
					<ConfirmDelete
						name={g.name}
						onConfirm={(r) => delItem.mutate(r)}
						trigger={
							<Button variant="destructive" size="sm">
								<Trash2Icon className="size-4" />
								{t("delete")}
							</Button>
						}
					/>
				) : null
			}
		>
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
				<Panel>
					<div className="overflow-hidden rounded-2xl bg-muted">
						<ResponsiveImage
							kind="gallery"
							fileId={g.fileId}
							alt={g.name}
							sizes="(min-width: 1024px) 40vw, 100vw"
							className="w-full object-contain"
						/>
					</div>
					<div className="mt-3 flex flex-wrap gap-1.5 text-sm">
						<Link
							to={`/admin/users/${g.ownerUserId}` as never}
							className="font-semibold hover:underline"
						>
							{g.ownerName}
						</Link>
						<span className="text-muted-foreground">
							· {t("galleryLikes", { count: g.likesCount })}
						</span>
						{g.nsfw ? <Badge variant="destructive">18+</Badge> : null}
						{g.aiDeclarationAcceptedAt ? (
							<Badge variant="secondary">{t("galleryAiDeclared")}</Badge>
						) : null}
						<Link
							to={`/gallery/${g.id}` as never}
							className="text-link hover:underline"
						>
							{t("viewPublic")}
						</Link>
					</div>
				</Panel>

				{can("gallery:edit") ? (
					<Panel title={t("galleryEdit")}>
						<form onSubmit={submit} className="space-y-3">
							<div className="space-y-1.5">
								<Label htmlFor="g-name">{t("galleryTitleLabel")}</Label>
								<Input
									id="g-name"
									value={name}
									maxLength={200}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="g-text">{t("galleryDescription")}</Label>
								<Textarea
									id="g-text"
									rows={4}
									maxLength={10000}
									value={longText}
									onChange={(e) => setLongText(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="g-tags">{t("galleryTags")}</Label>
								<Input
									id="g-tags"
									value={tags}
									onChange={(e) => setTags(e.target.value)}
								/>
							</div>
							<div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
								<Label htmlFor="sw-galleryNsfw">{t("galleryNsfw")}</Label>
								<Switch
									id="sw-galleryNsfw"
									checked={nsfw}
									onCheckedChange={setNsfw}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="g-reason">{t("reasonOptionalLabel")}</Label>
								<Input
									id="g-reason"
									value={reason}
									maxLength={500}
									onChange={(e) => setReason(e.target.value)}
								/>
							</div>
							<Button
								type="submit"
								disabled={save.isPending || !name.trim()}
								className="bg-primary text-primary-foreground hover:bg-primary/90"
							>
								{t("save")}
							</Button>
						</form>
					</Panel>
				) : null}
			</div>

			<Panel title={t("galleryComments", { count: g.comments.length })}>
				{g.comments.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{t("galleryNoComments")}
					</p>
				) : (
					<div className="space-y-2">
						{g.comments.map((cm) => (
							<div
								key={cm.id}
								className="flex items-start justify-between gap-3 rounded-xl border border-border p-2.5"
							>
								<div className="min-w-0">
									<p className="text-xs text-muted-foreground">
										<Link
											to={`/admin/users/${cm.userId}` as never}
											className="font-semibold text-foreground hover:underline"
										>
											{cm.authorName}
										</Link>{" "}
										· {fmt.dateTime(cm.createdAt)}
									</p>
									<p className="whitespace-pre-wrap text-sm">{cm.body}</p>
								</div>
								{can("gallery:comments") ? (
									<ReasonConfirm
										title={t("deleteCommentTitle")}
										confirmLabel={t("delete")}
										destructive
										onConfirm={(reason) =>
											delComment.mutate({ commentId: cm.id, reason })
										}
										trigger={
											<Button
												variant="ghost"
												size="sm"
												aria-label={t("deleteCommentTitle")}
												className="shrink-0"
											>
												<XIcon className="size-4" />
											</Button>
										}
									/>
								) : null}
							</div>
						))}
					</div>
				)}
			</Panel>
		</AdminPage>
	);
}
