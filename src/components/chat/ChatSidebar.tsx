import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	HeartHandshakeIcon,
	PlusIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusDot } from "@/components/StatusDot";
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
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { ChannelRow } from "./ChannelRow";
import { NewConversationDialog } from "./NewConversationDialog";
import { SidebarUserPanel } from "./SidebarUserPanel";

function initials(name: string | null | undefined, fallback: string): string {
	const source = name?.trim() || fallback;
	return source.charAt(0).toUpperCase();
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

			<SidebarUserPanel />
		</aside>
	);
}
