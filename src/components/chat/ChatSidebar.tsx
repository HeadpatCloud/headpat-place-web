import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	HashIcon,
	HeartHandshakeIcon,
	PencilIcon,
	PlusIcon,
	SettingsIcon,
	TrashIcon,
	UsersIcon,
	Volume2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { usePresence } from "@/components/contexts/PresenceProvider";
import { useUser } from "@/components/contexts/UserContext";
import { StatusDot } from "@/components/StatusDot";
import { StorageImage } from "@/components/StorageImage";
import { UserStatusMenu } from "@/components/UserStatusMenu";
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
import { cn } from "@/lib/utils";
import { NewConversationDialog } from "./NewConversationDialog";

function initials(name: string | null | undefined, fallback: string): string {
	const source = name?.trim() || fallback;
	return source.charAt(0).toUpperCase();
}

type Channel = {
	id: string;
	name: string;
	type: string;
};

function ChannelRow({
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

function ServerBlock({
	communityId,
	active,
	activeChannelId,
	onActivate,
}: {
	communityId: string;
	active: boolean;
	activeChannelId: string | null;
	onActivate: (id: string) => void;
}) {
	const t = useTranslations("chatUi");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const community = useQuery(
		orpc.community.byId.queryOptions({ input: { communityId } }),
	);
	const channels = useQuery({
		...orpc.channel.listByCommunity.queryOptions({ input: { communityId } }),
		enabled: active,
	});
	const myRole = useQuery({
		...orpc.community.myRoleIn.queryOptions({ input: { communityId } }),
		enabled: active,
	});
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
		<div>
			<div className="group flex items-center">
				<button
					type="button"
					onClick={() => onActivate(communityId)}
					className="flex flex-1 items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
				>
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
					{active ? (
						<ChevronDownIcon className="size-4 text-muted-foreground" />
					) : null}
				</button>
				{active && staff ? (
					<button
						type="button"
						onClick={() => {
							setNewName("");
							setCreating(true);
						}}
						className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
						aria-label={t("createChannel")}
					>
						<PlusIcon className="size-4" />
					</button>
				) : null}
			</div>

			{active ? (
				<div className="ml-3.5 mt-0.5 mb-1 flex flex-col gap-px border-l border-border pl-3">
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
			) : null}

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

export function ChatSidebar({ className }: { className?: string }) {
	const t = useTranslations("chatUi");
	const location = useLocation();
	const { userData, current } = useUser();
	const { presenceOf } = usePresence();

	const activeConversationId = useMemo(() => {
		const m = location.pathname.match(/\/chat\/dm\/([^/]+)/);
		return m ? m[1] : null;
	}, [location.pathname]);
	const activeChannelId = useMemo(() => {
		const m = location.pathname.match(/\/chat\/c\/([^/]+)/);
		return m ? m[1] : null;
	}, [location.pathname]);

	const conversations = useQuery(
		orpc.message.myConversations.queryOptions({
			input: { page: 1, pageSize: 30 },
		}),
	);
	const following = useQuery(
		orpc.community.myFollowing.queryOptions({ input: undefined }),
	);

	const communityIds = useMemo(
		() => following.data?.map((f) => f.communityId) ?? [],
		[following.data],
	);
	const [activeServer, setActiveServer] = useState<string | null>(null);
	const [composing, setComposing] = useState(false);
	const activeChannel = useQuery({
		...orpc.channel.byId.queryOptions({
			input: { channelId: activeChannelId ?? "" },
		}),
		enabled: !!activeChannelId,
	});
	const activeServerId =
		activeServer ?? activeChannel.data?.communityId ?? communityIds[0] ?? null;

	const meId = current?.$id;
	const meName = userData?.displayName || current?.name || t("youFallback");

	return (
		<aside
			className={cn(
				"flex h-full w-full shrink-0 flex-col border-r border-border bg-background md:w-[270px]",
				className,
			)}
		>
			<Link
				to="/"
				className="flex h-13 shrink-0 items-center gap-2 border-b border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
			>
				<ChevronLeftIcon className="size-4 text-muted-foreground" />
				<span>headpat</span>
			</Link>

			<div className="flex-1 overflow-y-auto px-3 pb-2 pt-3.5">
				<div className="flex items-center pl-2.5 pr-1 pb-2 pt-0.5">
					<span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
						{t("messagesHeading")}
					</span>
					<button
						type="button"
						onClick={() => setComposing(true)}
						className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label={t("newMessage")}
					>
						<PlusIcon className="size-4" />
					</button>
				</div>
				{conversations.data?.items.map((c) => {
					const isGroup = c.others.length > 1;
					const other = c.others[0];
					const label = c.name
						? c.name
						: isGroup
							? c.others.map((o) => o.displayName || o.name || "?").join(", ")
							: other?.displayName || other?.name || t("conversationFallback");
					const isActive = c.id === activeConversationId;
					return (
						<Link
							key={c.id}
							to={`/chat/dm/${c.id}` as never}
							className={`relative flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${
								isActive
									? "bg-primary/15 text-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							<span className="relative shrink-0">
								{isGroup ? (
									<div className="flex size-6.5 items-center justify-center rounded-full bg-muted text-muted-foreground">
										<UsersIcon className="size-3.5" />
									</div>
								) : (
									<>
										<StorageImage
											kind="avatar"
											fileId={other?.avatarFileId}
											variant="sm"
											className="size-6.5 rounded-full object-cover bg-muted"
											fallback={
												<div className="flex size-6.5 items-center justify-center rounded-full bg-muted text-xs font-semibold leading-none">
													{initials(label, "?")}
												</div>
											}
										/>
										{other ? (
											<StatusDot
												userId={other.userId}
												className="absolute -bottom-0.5 -right-0.5 border-background"
											/>
										) : null}
									</>
								)}
							</span>
							<span className="flex-1 truncate text-sm font-semibold text-foreground">
								{label}
							</span>
						</Link>
					);
				})}

				<div className="px-2.5 pb-2 pt-4.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					{t("serversHeading")}
				</div>
				{communityIds.map((id) => (
					<ServerBlock
						key={id}
						communityId={id}
						active={id === activeServerId}
						activeChannelId={activeChannelId}
						onActivate={setActiveServer}
					/>
				))}
			</div>

			<NewConversationDialog open={composing} onOpenChange={setComposing} />

			<div className="flex h-15 shrink-0 items-center gap-1 border-t border-border bg-card px-2">
				<UserStatusMenu>
					<button
						type="button"
						className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"
					>
						<span className="relative shrink-0">
							<StorageImage
								kind="avatar"
								fileId={userData?.avatarId}
								variant="md"
								className="size-8.5 rounded-full object-cover bg-muted"
								fallback={
									<div className="flex size-8.5 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold leading-none text-primary">
										{initials(meName, "Y")}
									</div>
								}
							/>
							{meId ? (
								<StatusDot
									userId={meId}
									className="absolute -bottom-0.5 -right-0.5 border-card"
								/>
							) : null}
						</span>
						<div className="min-w-0 flex-1 leading-tight">
							<div className="truncate text-sm font-semibold text-foreground">
								{meName}
							</div>
							<div className="truncate text-xs text-muted-foreground">
								{(meId && presenceOf(meId)?.customStatus) ||
									(meId
										? (presenceOf(meId)?.status ?? t("statusOffline"))
										: t("statusOffline"))}
							</div>
						</div>
					</button>
				</UserStatusMenu>
				<Link
					to="/account"
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label={t("settings")}
				>
					<SettingsIcon className="size-4" />
				</Link>
			</div>
		</aside>
	);
}
