import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import {
	ChevronDownIcon,
	ChevronLeftIcon,
	SettingsIcon,
	Volume2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { usePresence } from "@/components/contexts/PresenceProvider";
import { useUser } from "@/components/contexts/UserContext";
import { StatusDot } from "@/components/StatusDot";
import { StorageImage } from "@/components/StorageImage";
import { orpc } from "@/lib/orpc";

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
	const community = useQuery(
		orpc.community.byId.queryOptions({ input: { communityId } }),
	);
	const channels = useQuery({
		...orpc.channel.listByCommunity.queryOptions({ input: { communityId } }),
		enabled: active,
	});
	const name = community.data?.name ?? "…";

	return (
		<div>
			<button
				type="button"
				onClick={() => onActivate(communityId)}
				className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
			>
				<StorageImage
					kind="community-avatar"
					fileId={community.data?.avatarFileId}
					variant="sm"
					className="size-7 shrink-0 rounded-md object-cover bg-muted"
					fallback={
						<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-xs font-semibold text-primary">
							{initials(name, "C")}
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

			{active ? (
				<div className="ml-3.5 mt-0.5 mb-1 flex flex-col gap-px border-l border-border pl-3">
					{channels.data?.map((ch) =>
						ch.type === "voice" ? (
							<div
								key={ch.id}
								className="flex cursor-default items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground/55"
							>
								<Volume2Icon className="size-3.5" />
								<span className="truncate">{ch.name}</span>
							</div>
						) : (
							<Link
								key={ch.id}
								to={`/chat/c/${ch.id}` as never}
								className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								activeProps={{
									className:
										"flex items-center gap-2 rounded-md px-3 py-1.5 text-sm bg-primary/15 text-foreground font-semibold",
								}}
								aria-current={ch.id === activeChannelId ? "page" : undefined}
							>
								<span className="font-medium text-muted-foreground">#</span>
								<span className="truncate">{ch.name}</span>
							</Link>
						),
					)}
				</div>
			) : null}
		</div>
	);
}

export function ChatSidebar() {
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
	const activeServerId =
		activeChannelId && communityIds.length
			? (activeServer ?? communityIds[0])
			: (activeServer ?? communityIds[0] ?? null);

	const meId = current?.$id;
	const meName = userData?.displayName || current?.name || "you";

	return (
		<aside className="flex h-svh w-[270px] shrink-0 flex-col border-r border-border bg-background">
			<Link
				to="/"
				className="flex h-13 shrink-0 items-center gap-2 border-b border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
			>
				<ChevronLeftIcon className="size-4 text-muted-foreground" />
				<span>headpat</span>
			</Link>

			<div className="flex-1 overflow-y-auto px-3 pb-2 pt-3.5">
				<div className="px-2.5 pb-2 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					Direct Messages
				</div>
				{conversations.data?.items.map((c) => {
					const other = c.others[0];
					const label = other?.displayName || other?.name || "Conversation";
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
								<StorageImage
									kind="avatar"
									fileId={other?.avatarFileId}
									variant="sm"
									className="size-6.5 rounded-full object-cover bg-muted"
									fallback={
										<div className="flex size-6.5 items-center justify-center rounded-full bg-muted text-xs font-semibold">
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
							</span>
							<span className="flex-1 truncate text-sm font-semibold text-foreground">
								{label}
							</span>
						</Link>
					);
				})}

				<div className="px-2.5 pb-2 pt-4.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					Servers
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

			<div className="flex h-15 shrink-0 items-center gap-3 border-t border-border bg-card px-3.5">
				<span className="relative shrink-0">
					<StorageImage
						kind="avatar"
						fileId={userData?.avatarId}
						variant="md"
						className="size-8.5 rounded-full object-cover bg-muted"
						fallback={
							<div className="flex size-8.5 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
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
					<div className="text-xs text-muted-foreground">
						{meId ? (presenceOf(meId)?.status ?? "offline") : "offline"}
					</div>
				</div>
				<Link
					to="/account"
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Settings"
				>
					<SettingsIcon className="size-4" />
				</Link>
			</div>
		</aside>
	);
}
