import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HashIcon, PencilLineIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NewConversationDialog } from "@/components/chat/NewConversationDialog";
import { StorageImage } from "@/components/StorageImage";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { type RecentKind, useRecentChats } from "@/lib/use-recent-chats";

type DmConversation = {
	id: string;
	name: string | null;
	others: {
		userId: string;
		displayName: string | null;
		name: string | null;
		profileUrl: string | null;
		avatarFileId: string | null;
	}[];
};

type ChannelHit = {
	id: string;
	name: string;
	communityId: string;
	communityName: string;
	communityAvatarFileId: string | null;
};

function dmLabel(c: DmConversation, fallback: string): string {
	if (c.name) return c.name;
	const names = c.others
		.map((o) => o.displayName || o.name || o.profileUrl)
		.filter(Boolean);
	return names.length ? names.join(", ") : fallback;
}

export function QuickSwitcher({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const t = useTranslations("chatUi");
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { data: session } = useSession();
	const meId = session?.user?.id;
	const recents = useRecentChats();
	const [query, setQuery] = useState("");
	const [debounced, setDebounced] = useState("");
	const [newGroup, setNewGroup] = useState(false);

	useEffect(() => {
		const h = setTimeout(() => setDebounced(query.trim()), 200);
		return () => clearTimeout(h);
	}, [query]);

	useEffect(() => {
		if (!open) {
			setQuery("");
			setDebounced("");
		}
	}, [open]);

	const conversations = useQuery({
		...orpc.message.myConversations.queryOptions({
			input: { page: 1, pageSize: 100 },
		}),
		enabled: open,
	});
	const drafts = useQuery({
		...orpc.draft.list.queryOptions({ input: {} }),
		enabled: open,
	});

	const searching = debounced.length >= 1;
	const members = useQuery({
		...orpc.profile.searchConnected.queryOptions({
			input: { search: debounced, limit: 20 },
		}),
		enabled: open && searching,
	});
	const channelSearch = useQuery({
		...orpc.channel.searchFollowed.queryOptions({
			input: { search: debounced, limit: 30 },
		}),
		enabled: open && searching,
	});
	// Channels for resolving Recent labels (cached, refetched per open).
	const allChannels = useQuery({
		...orpc.channel.searchFollowed.queryOptions({ input: {} }),
		enabled: open,
	});

	const convItems = (conversations.data?.items ?? []) as DmConversation[];
	const convById = useMemo(
		() => new Map(convItems.map((c) => [c.id, c])),
		[convItems],
	);
	const channelById = useMemo(() => {
		const m = new Map<string, ChannelHit>();
		for (const c of (allChannels.data ?? []) as ChannelHit[]) m.set(c.id, c);
		return m;
	}, [allChannels.data]);

	const go = (to: string) => {
		onOpenChange(false);
		navigate({ to: to as never });
	};

	const openDmWith = async (userId: string) => {
		const existing = convItems.find(
			(c) => c.others.length === 1 && c.others[0]?.userId === userId,
		);
		if (existing) return go(`/chat/dm/${existing.id}`);
		const conv = await client.message.startConversation({
			participantUserIds: [userId],
		});
		await qc.invalidateQueries({
			queryKey: orpc.message.myConversations.key(),
		});
		go(`/chat/dm/${conv.id}`);
	};

	const recentRows = recents
		.list()
		.map((r) => {
			if (r.kind === "dm") {
				const c = convById.get(r.id);
				if (!c) return null;
				return {
					kind: "dm" as RecentKind,
					id: r.id,
					label: dmLabel(c, t("conversationFallback")),
					avatarFileId: c.others[0]?.avatarFileId ?? null,
				};
			}
			const ch = channelById.get(r.id);
			if (!ch) return null;
			return {
				kind: "channel" as RecentKind,
				id: r.id,
				label: ch.name,
				avatarFileId: ch.communityAvatarFileId,
			};
		})
		.filter((x): x is NonNullable<typeof x> => x !== null);

	const memberHits = (members.data ?? []).filter((u) => u.userId !== meId);
	const channelHits = (channelSearch.data ?? []) as ChannelHit[];

	return (
		<>
			<CommandDialog
				open={open}
				onOpenChange={onOpenChange}
				shouldFilter={false}
			>
				<CommandInput
					placeholder={t("searchPlaceholder")}
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					<CommandEmpty>{t("emptySearch")}</CommandEmpty>

					{!searching && recentRows.length > 0 ? (
						<CommandGroup heading={t("recentHeading")}>
							{recentRows.map((r) => (
								<CommandItem
									key={`recent-${r.kind}-${r.id}`}
									value={`recent ${r.label} ${r.id}`}
									onSelect={() =>
										go(r.kind === "dm" ? `/chat/dm/${r.id}` : `/chat/c/${r.id}`)
									}
								>
									{r.kind === "channel" ? (
										<HashIcon className="size-4 shrink-0 text-muted-foreground" />
									) : (
										<StorageImage
											kind="avatar"
											fileId={r.avatarFileId}
											variant="sm"
											className="size-6 shrink-0 rounded-full object-cover bg-muted"
											fallback={
												<div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
													{(r.label.charAt(0) || "?").toUpperCase()}
												</div>
											}
										/>
									)}
									<span className="truncate">{r.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					) : null}

					{!searching && (drafts.data?.length ?? 0) > 0 ? (
						<>
							<CommandSeparator />
							<CommandGroup heading={t("draftsHeading")}>
								{(drafts.data ?? []).map((d) => (
									<CommandItem
										key={`draft-${d.kind}-${d.targetId}`}
										value={`draft ${d.label} ${d.targetId}`}
										onSelect={() =>
											go(
												d.kind === "dm"
													? `/chat/dm/${d.targetId}`
													: `/chat/c/${d.targetId}`,
											)
										}
									>
										<PencilLineIcon className="size-4 shrink-0 text-muted-foreground" />
										<span className="truncate">{d.label}</span>
										<span className="ml-auto truncate text-xs text-muted-foreground">
											{d.body}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</>
					) : null}

					{searching && memberHits.length > 0 ? (
						<CommandGroup heading={t("membersHeading")}>
							{memberHits.map((u) => {
								const label = u.displayName || u.name || t("userFallback");
								return (
									<CommandItem
										key={`member-${u.userId}`}
										value={`member ${label} ${u.userId}`}
										onSelect={() => void openDmWith(u.userId)}
									>
										<StorageImage
											kind="avatar"
											fileId={u.avatarFileId}
											variant="sm"
											className="size-6 shrink-0 rounded-full object-cover bg-muted"
											fallback={
												<div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
													{(label.charAt(0) || "?").toUpperCase()}
												</div>
											}
										/>
										<span className="truncate">{label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					) : null}

					{searching && channelHits.length > 0 ? (
						<>
							<CommandSeparator />
							<CommandGroup heading={t("channelsHeading")}>
								{channelHits.map((c) => (
									<CommandItem
										key={`channel-${c.id}`}
										value={`channel ${c.name} ${c.communityName} ${c.id}`}
										onSelect={() => go(`/chat/c/${c.id}`)}
									>
										<HashIcon className="size-4 shrink-0 text-muted-foreground" />
										<span className="truncate">{c.name}</span>
										<span className="ml-auto truncate text-xs text-muted-foreground">
											{c.communityName}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</>
					) : null}

					<CommandSeparator />
					<CommandGroup>
						<CommandItem
							value="new-group"
							onSelect={() => {
								onOpenChange(false);
								setNewGroup(true);
							}}
						>
							<UserPlusIcon className="size-4 shrink-0 text-muted-foreground" />
							<span>{t("newGroup")}</span>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>

			<NewConversationDialog open={newGroup} onOpenChange={setNewGroup} />
		</>
	);
}
