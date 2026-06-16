import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HashIcon, PencilIcon, TrashIcon, Volume2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export type Channel = {
	id: string;
	name: string;
	type: string;
};

export function ChannelRow({
	channel: ch,
	communityId,
	activeChannelId,
	staff,
}: {
	channel: Channel;
	communityId: string;
	activeChannelId: string | null;
	staff: boolean;
}) {
	const t = useTranslations("chatUi");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const [renaming, setRenaming] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [name, setName] = useState(ch.name);

	const invalidate = () =>
		qc.invalidateQueries({
			queryKey: orpc.channel.listByCommunity.queryKey({
				input: { communityId },
			}),
		});

	const rename = useMutation({
		mutationFn: (next: string) =>
			client.channel.rename({ channelId: ch.id, name: next }),
		onSuccess: () => {
			invalidate();
			setRenaming(false);
			toast.success(t("channelRenamed"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const remove = useMutation({
		mutationFn: () => client.channel.delete({ channelId: ch.id }),
		onSuccess: () => {
			invalidate();
			setDeleting(false);
			toast.success(t("channelDeleted"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const controls = staff ? (
		<span className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					setName(ch.name);
					setRenaming(true);
				}}
				className="flex size-5 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-background hover:text-foreground"
				aria-label={t("renameChannel")}
			>
				<PencilIcon className="size-3" />
			</button>
			<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					setDeleting(true);
				}}
				className="flex size-5 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-background hover:text-destructive"
				aria-label={t("deleteChannel")}
			>
				<TrashIcon className="size-3" />
			</button>
		</span>
	) : null;

	const row =
		ch.type === "voice" ? (
			<div className="group flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground/55">
				<Volume2Icon className="size-4 shrink-0" />
				<span className="truncate">{ch.name}</span>
				{controls}
			</div>
		) : (
			<Link
				to={`/chat/c/${ch.id}` as never}
				className="group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				activeProps={{
					className:
						"group flex items-center gap-2 rounded-md px-3 py-1.5 text-sm bg-primary/15 text-foreground font-semibold",
				}}
				aria-current={ch.id === activeChannelId ? "page" : undefined}
			>
				<HashIcon className="size-4 shrink-0" />
				<span className="truncate">{ch.name}</span>
				{controls}
			</Link>
		);

	return (
		<>
			{row}

			<Dialog open={renaming} onOpenChange={setRenaming}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t("renameChannelTitle")}</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const trimmed = name.trim();
							if (trimmed) rename.mutate(trimmed);
						}}
					>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={100}
							autoFocus
							placeholder={t("channelNamePlaceholder")}
						/>
						<DialogFooter className="mt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setRenaming(false)}
							>
								{c("cancel")}
							</Button>
							<Button type="submit" disabled={rename.isPending || !name.trim()}>
								{c("save")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog open={deleting} onOpenChange={setDeleting}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("deleteChannelConfirm", { name: ch.name })}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteChannelDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={(e) => {
								e.preventDefault();
								remove.mutate();
							}}
							disabled={remove.isPending}
						>
							{c("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
