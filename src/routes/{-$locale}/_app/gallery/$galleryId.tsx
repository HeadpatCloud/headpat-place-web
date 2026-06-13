import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HeartIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { useStorageUrl } from "@/components/StorageImage";
import { UserCard } from "@/components/UserCard";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/gallery/$galleryId")({
	component: GalleryItemPage,
});

function GalleryItemPage() {
	const t = useTranslations("galleryPages");
	const c = useTranslations("common");
	const { galleryId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const fmt = useDateFormat();
	const item = useQuery(
		orpc.gallery.byId.queryOptions({ input: { itemId: galleryId } }),
	);

	const deleteMut = useMutation({
		mutationFn: () => client.gallery.delete({ itemId: galleryId }),
		onSuccess: async () => {
			toast.success(t("deleted"));
			await queryClient.invalidateQueries({ queryKey: ["gallery"] });
			navigate({ to: "/gallery" as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const likeMut = useMutation({
		mutationFn: (liked: boolean) =>
			liked
				? client.gallery.unlike({ itemId: galleryId })
				: client.gallery.like({ itemId: galleryId }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: orpc.gallery.byId.queryKey({ input: { itemId: galleryId } }),
			}),
		onError: (e: Error) => toast.error(e.message),
	});

	if (item.isPending)
		return <p className="p-4 text-muted-foreground">{c("loading")}</p>;
	if (item.isError || !item.data) return <p className="p-4">{t("notFound")}</p>;
	const g = item.data;
	const isOwner = session?.user?.id === g.userId;
	const isVideo = g.mimeType?.startsWith("video/") ?? false;

	return (
		<main>
			<Card className="overflow-hidden">
				{isVideo ? (
					<GalleryVideo fileId={g.fileId} mimeType={g.mimeType} />
				) : (
					<ResponsiveImage
						kind="gallery"
						fileId={g.fileId}
						alt={g.name}
						sizes="(min-width:768px) 768px, 100vw"
						className="w-full max-h-[80vh] object-contain bg-muted"
						fallback={<div className="h-96 w-full bg-muted" />}
					/>
				)}
				<CardHeader className="flex flex-row items-start justify-between gap-4">
					<CardTitle>{g.name}</CardTitle>
					{isOwner ? (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="sm">
									{c("delete")}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{t("deleteImageTitle")}</AlertDialogTitle>
									<AlertDialogDescription>
										{t("deleteImageBody")}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => deleteMut.mutate()}
										disabled={deleteMut.isPending}
									>
										{deleteMut.isPending ? t("deleting") : c("delete")}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					) : null}
				</CardHeader>
				<CardContent className="space-y-4">
					{g.author ? (
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								{t("postedBy")}
							</p>
							<UserCard user={g.author} />
						</div>
					) : null}
					{g.longText ? (
						<p className="whitespace-pre-wrap">{g.longText}</p>
					) : null}
					<div className="flex items-center gap-3">
						<Button
							variant={g.likedByMe ? "default" : "outline"}
							size="sm"
							disabled={!session?.user || likeMut.isPending}
							onClick={() => likeMut.mutate(g.likedByMe)}
							className={
								g.likedByMe
									? "bg-primary text-primary-foreground hover:bg-primary/90"
									: ""
							}
						>
							<HeartIcon
								className={`size-4 ${g.likedByMe ? "fill-current" : ""}`}
							/>
							{g.likesCount}
						</Button>
					</div>
					<div className="flex gap-2 flex-wrap">
						{g.nsfw ? <Badge variant="destructive">{t("nsfw")}</Badge> : null}
						{(g.tags ?? []).map((t) => (
							<Badge key={t} variant="secondary">
								{t}
							</Badge>
						))}
					</div>
					<p className="text-xs text-muted-foreground">
						{t("uploadedAt", { date: fmt.dateTime(g.createdAt) })}
						{g.updatedAt &&
						new Date(g.updatedAt).getTime() !== new Date(g.createdAt).getTime()
							? t("editedAt", { date: fmt.dateTime(g.updatedAt) })
							: ""}
					</p>
				</CardContent>
			</Card>

			<CommentsSection
				galleryId={galleryId}
				itemOwnerId={g.userId}
				canComment={!!session?.user}
			/>
		</main>
	);
}

function CommentsSection({
	galleryId,
	itemOwnerId,
	canComment,
}: {
	galleryId: string;
	itemOwnerId: string;
	canComment: boolean;
}) {
	const t = useTranslations("galleryPages");
	const c = useTranslations("common");
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const fmt = useDateFormat();
	const [body, setBody] = useState("");
	const comments = useQuery(
		orpc.gallery.comments.queryOptions({ input: { itemId: galleryId } }),
	);

	function invalidate() {
		queryClient.invalidateQueries({
			queryKey: orpc.gallery.comments.queryKey({
				input: { itemId: galleryId },
			}),
		});
		queryClient.invalidateQueries({
			queryKey: orpc.gallery.byId.queryKey({ input: { itemId: galleryId } }),
		});
	}

	const add = useMutation({
		mutationFn: () =>
			client.gallery.comment({ itemId: galleryId, body: body.trim() }),
		onSuccess: () => {
			setBody("");
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const remove = useMutation({
		mutationFn: (commentId: string) =>
			client.gallery.deleteComment({ commentId }),
		onSuccess: invalidate,
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<Card className="mt-4">
			<CardHeader>
				<CardTitle className="text-lg">{t("comments")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{canComment ? (
					<div className="space-y-2">
						<Textarea
							value={body}
							onChange={(e) => setBody(e.target.value)}
							placeholder={t("commentPlaceholder")}
							maxLength={2000}
						/>
						<Button
							size="sm"
							disabled={add.isPending}
							onClick={() =>
								body.trim()
									? add.mutate()
									: toast.error(t("writeSomethingFirst"))
							}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{t("comment")}
						</Button>
					</div>
				) : null}

				{comments.isPending ? (
					<p className="text-sm text-muted-foreground">{c("loading")}</p>
				) : (comments.data ?? []).length === 0 ? (
					<p className="text-sm text-muted-foreground">{t("noComments")}</p>
				) : (
					<div className="space-y-3">
						{(comments.data ?? []).map((c) => {
							const canDelete =
								session?.user?.id === c.author?.userId ||
								session?.user?.id === itemOwnerId;
							return (
								<div
									key={c.id}
									className="flex items-start justify-between gap-3"
								>
									<div className="min-w-0 flex-1 space-y-1">
										{c.author ? <UserCard user={c.author} /> : null}
										<p className="whitespace-pre-wrap text-sm">{c.body}</p>
										<p className="text-xs text-muted-foreground">
											{fmt.dateTime(c.createdAt)}
										</p>
									</div>
									{canDelete ? (
										<Button
											variant="ghost"
											size="icon"
											disabled={remove.isPending}
											onClick={() => remove.mutate(c.id)}
											title={t("deleteComment")}
										>
											<Trash2Icon className="size-4 text-muted-foreground" />
										</Button>
									) : null}
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function GalleryVideo({
	fileId,
	mimeType,
}: {
	fileId: string | null | undefined;
	mimeType: string | null | undefined;
}) {
	const src = useStorageUrl("gallery", fileId);
	const poster = useStorageUrl("gallery", fileId, "1280");
	if (!fileId || !src.data)
		return <div className="aspect-video w-full animate-pulse bg-muted" />;
	return (
		<video
			controls
			controlsList="nodownload"
			playsInline
			loop
			poster={poster.data?.url}
			className="max-h-[80vh] w-full bg-black object-contain"
		>
			<source src={src.data.url} type={mimeType ?? undefined} />
		</video>
	);
}
