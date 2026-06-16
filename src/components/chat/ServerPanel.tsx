import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartHandshakeIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StorageImage } from "@/components/StorageImage";
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
import { client, orpc } from "@/lib/orpc";
import { ChannelRow } from "./ChannelRow";

export function ServerPanel({
	communityId,
	activeChannelId,
}: {
	communityId: string;
	activeChannelId: string | null;
}) {
	const t = useTranslations("chatUi");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const community = useQuery(
		orpc.community.byId.queryOptions({ input: { communityId } }),
	);
	const channels = useQuery(
		orpc.channel.listByCommunity.queryOptions({ input: { communityId } }),
	);
	const myRole = useQuery(
		orpc.community.myRoleIn.queryOptions({ input: { communityId } }),
	);
	const role = myRole.data?.role;
	const staff = role === "owner" || role === "admin" || role === "moderator";

	const [creating, setCreating] = useState(false);
	const [newName, setNewName] = useState("");

	const create = useMutation({
		mutationFn: (name: string) => client.channel.create({ communityId, name }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: orpc.channel.listByCommunity.queryKey({
					input: { communityId },
				}),
			});
			setCreating(false);
			setNewName("");
			toast.success(t("channelCreated"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const name = community.data?.name ?? "…";

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="group flex h-13 shrink-0 items-center gap-3 border-b border-border px-3.5">
				<StorageImage
					kind="community-avatar"
					fileId={community.data?.avatarFileId}
					variant="sm"
					className="size-7 shrink-0 rounded-md object-cover bg-muted"
					fallback={
						<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
							<HeartHandshakeIcon className="size-4" />
						</div>
					}
				/>
				<span className="flex-1 truncate text-sm font-semibold text-foreground">
					{name}
				</span>
				{staff ? (
					<button
						type="button"
						onClick={() => {
							setNewName("");
							setCreating(true);
						}}
						className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label={t("createChannel")}
					>
						<PlusIcon className="size-4" />
					</button>
				) : null}
			</div>

			<div className="flex-1 overflow-y-auto px-2 py-2">
				<div className="flex flex-col gap-px">
					{channels.data?.map((ch) => (
						<ChannelRow
							key={ch.id}
							channel={ch}
							communityId={communityId}
							activeChannelId={activeChannelId}
							staff={staff}
						/>
					))}
				</div>
			</div>

			<Dialog open={creating} onOpenChange={setCreating}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t("createChannelTitle")}</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const trimmed = newName.trim();
							if (trimmed) create.mutate(trimmed);
						}}
					>
						<Input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							maxLength={100}
							autoFocus
							placeholder={t("newChannelPlaceholder")}
						/>
						<DialogFooter className="mt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setCreating(false)}
							>
								{c("cancel")}
							</Button>
							<Button
								type="submit"
								disabled={create.isPending || !newName.trim()}
							>
								{c("create")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
