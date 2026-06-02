import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	HashIcon,
	PlusIcon,
	SearchIcon,
	SendHorizontalIcon,
	SmileIcon,
	UsersIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePresence } from "@/components/contexts/PresenceProvider";
import { StorageImage } from "@/components/StorageImage";
import { useSession } from "@/lib/auth-client";
import { useDateFormat } from "@/lib/datetime";
import { client, orpc } from "@/lib/orpc";

type Source =
	| { kind: "dm"; conversationId: string }
	| { kind: "channel"; channelId: string };

type ParticipantInfo = {
	userId: string;
	name: string | null;
	displayName: string | null;
	profileUrl: string | null;
	avatarFileId?: string | null;
};

type Msg = {
	id: string;
	senderId: string;
	body: string;
	createdAt: string | Date;
	author?: {
		userId: string;
		profileUrl: string | null;
		displayName: string | null;
		name: string | null;
		avatarFileId: string | null;
	} | null;
};

function initials(name: string): string {
	return (name.trim().charAt(0) || "?").toUpperCase();
}

export function MessagePane({ source }: { source: Source }) {
	const sourceId =
		source.kind === "dm" ? source.conversationId : source.channelId;
	const { data: session } = useSession();
	const { typingIn, sendTyping, sendChannelTyping } = usePresence();
	const qc = useQueryClient();
	const fmt = useDateFormat();
	const [draft, setDraft] = useState("");
	const [showMembers, setShowMembers] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const dmConversationId =
		source.kind === "dm" ? source.conversationId : "__none__";
	const channelId = source.kind === "channel" ? source.channelId : "__none__";

	const participants = useQuery({
		...orpc.message.participants.queryOptions({
			input: { conversationId: dmConversationId },
		}),
		enabled: source.kind === "dm",
	});
	const channelInfo = useQuery({
		...orpc.channel.byId.queryOptions({ input: { channelId } }),
		enabled: source.kind === "channel",
	});

	const dmMessages = useQuery({
		...orpc.message.list.queryOptions({
			input: { conversationId: dmConversationId, limit: 200 },
		}),
		enabled: source.kind === "dm",
		refetchInterval: 15000,
	});
	const channelMessages = useQuery({
		...orpc.channel.messages.queryOptions({
			input: { channelId, limit: 200 },
		}),
		enabled: source.kind === "channel",
		refetchInterval: 15000,
	});
	const messages = source.kind === "dm" ? dmMessages : channelMessages;

	const sendMut = useMutation({
		mutationFn: async (body: string) =>
			source.kind === "dm"
				? client.message.send({ conversationId: source.conversationId, body })
				: client.channel.send({ channelId: source.channelId, body }),
		onSuccess: async () => {
			setDraft("");
			if (source.kind === "dm") {
				await qc.invalidateQueries({
					queryKey: orpc.message.list.queryKey({
						input: { conversationId: source.conversationId, limit: 200 },
					}),
				});
			} else {
				await qc.invalidateQueries({
					queryKey: orpc.channel.messages.queryKey({
						input: { channelId: source.channelId, limit: 200 },
					}),
				});
			}
		},
		onError: (e: Error) => toast.error(e.message),
	});

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
	}, [messages.data]);

	const parts: ParticipantInfo[] = participants.data ?? [];
	const byUser = new Map(parts.map((p) => [p.userId, p]));
	const meId = session?.user?.id;
	const others = parts.filter((p) => p.userId !== meId);

	const nameOf = (userId: string) => {
		const p = byUser.get(userId);
		if (p) return p.displayName || p.name || p.profileUrl || userId.slice(0, 8);
		if (userId === meId) return session?.user?.name ?? "You";
		return userId.slice(0, 8);
	};

	const title =
		source.kind === "channel"
			? (channelInfo.data?.name ?? "…")
			: others.length === 0
				? "Just you"
				: others.map((p) => p.displayName || p.name || p.profileUrl).join(", ");
	const topic =
		source.kind === "channel" ? (channelInfo.data?.topic ?? null) : null;
	const placeholder =
		source.kind === "channel"
			? `Message #${channelInfo.data?.name ?? "channel"}`
			: `Message ${title}`;

	const typers = typingIn(sourceId).filter((id) => id !== meId);

	function onSend() {
		const body = draft.trim();
		if (!body) return;
		sendMut.mutate(body);
	}

	const list = (messages.data ?? []) as Msg[];

	return (
		<div className="flex h-full flex-col bg-background text-foreground">
			<header className="flex h-15 shrink-0 items-center gap-3 border-b border-border px-5">
				{source.kind === "channel" ? (
					<HashIcon className="size-5 text-muted-foreground" />
				) : others.length > 1 ? (
					<UsersIcon className="size-5 text-muted-foreground" />
				) : null}
				<span className="text-base font-semibold text-foreground">{title}</span>
				{topic ? (
					<span className="ml-1 flex-1 truncate border-l border-border pl-3 text-sm text-muted-foreground">
						{topic}
					</span>
				) : (
					<span className="flex-1" />
				)}
				<div className="flex shrink-0 items-center gap-3">
					<button
						type="button"
						onClick={() => setShowMembers((v) => !v)}
						aria-pressed={showMembers}
						aria-label="Toggle members"
						className={`flex size-8.5 items-center justify-center rounded-md transition-colors ${
							showMembers
								? "bg-primary/15 text-foreground"
								: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
					>
						<UsersIcon className="size-4" />
					</button>
					<div className="flex w-48 cursor-text items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
						<SearchIcon className="size-3.5 opacity-80" />
						<span>Search</span>
					</div>
				</div>
			</header>

			<div className="flex min-h-0 flex-1">
				<div
					ref={scrollRef}
					className="flex flex-1 flex-col overflow-y-auto px-5 pb-4 pt-2"
				>
					{messages.isPending ? (
						<p className="py-4 text-muted-foreground">Loading messages…</p>
					) : list.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground">
							No messages yet. Say hi.
						</p>
					) : (
						<>
							<div className="my-4 flex items-center gap-3.5">
								<span className="h-px flex-1 bg-border" />
								<span className="text-xs font-semibold text-muted-foreground">
									Today
								</span>
								<span className="h-px flex-1 bg-border" />
							</div>
							{list.map((m, i) => {
								const prev = list[i - 1];
								const grouped = prev?.senderId === m.senderId;
								const isMe = m.senderId === meId;
								const displayName = isMe
									? (session?.user?.name ?? "You")
									: m.author
										? m.author.displayName ||
											m.author.name ||
											nameOf(m.senderId)
										: nameOf(m.senderId);
								const avatarFileId =
									m.author?.avatarFileId ??
									byUser.get(m.senderId)?.avatarFileId;
								return (
									<div
										key={m.id}
										className={`flex gap-4 rounded-md px-2 py-1 hover:bg-foreground/[0.015] ${
											grouped ? "" : "mt-1.5"
										}`}
									>
										<div className="w-10.5 shrink-0">
											{grouped ? null : (
												<StorageImage
													kind="avatar"
													fileId={avatarFileId}
													variant="md"
													className="size-10.5 rounded-full object-cover bg-muted"
													fallback={
														<div className="flex size-10.5 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
															{initials(displayName)}
														</div>
													}
												/>
											)}
										</div>
										<div className="min-w-0 flex-1">
											{grouped ? null : (
												<div className="mb-1 flex items-baseline gap-2.5">
													<span className="text-sm font-semibold text-foreground">
														{displayName}
													</span>
													<span className="text-xs text-muted-foreground">
														{fmt.time(m.createdAt, {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
												</div>
											)}
											<div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
												{m.body}
											</div>
										</div>
									</div>
								);
							})}
						</>
					)}
				</div>

				{showMembers ? (
					<aside className="w-56 shrink-0 overflow-y-auto border-l border-border px-3 py-4">
						<div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							Members
						</div>
						{source.kind === "dm" ? (
							parts.map((p) => (
								<div
									key={p.userId}
									className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground"
								>
									<StorageImage
										kind="avatar"
										fileId={p.avatarFileId}
										variant="sm"
										className="size-6.5 rounded-full object-cover bg-muted"
										fallback={
											<div className="flex size-6.5 items-center justify-center rounded-full bg-muted text-xs font-semibold">
												{initials(nameOf(p.userId))}
											</div>
										}
									/>
									<span className="truncate">{nameOf(p.userId)}</span>
								</div>
							))
						) : (
							<p className="px-2 text-sm text-muted-foreground">
								Member list coming soon.
							</p>
						)}
					</aside>
				) : null}
			</div>

			<div className="shrink-0 px-5 pb-5 pt-1.5">
				{typers.length > 0 ? (
					<div className="px-1 pb-1 text-xs text-muted-foreground">
						{source.kind === "dm"
							? `${typers.map((id) => nameOf(id)).join(", ")} ${
									typers.length === 1 ? "is" : "are"
								} typing…`
							: typers.length === 1
								? "Someone is typing…"
								: `${typers.length} people are typing…`}
					</div>
				) : null}
				<form
					className="flex items-center gap-3 rounded-2xl border border-border bg-card px-1.5 py-1.5 transition-colors focus-within:border-ring"
					onSubmit={(e) => {
						e.preventDefault();
						onSend();
					}}
				>
					<button
						type="button"
						className="flex size-9.5 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Attach"
					>
						<PlusIcon className="size-5" />
					</button>
					<input
						className="flex-1 bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
						placeholder={placeholder}
						value={draft}
						onChange={(e) => {
							setDraft(e.target.value);
							if (source.kind === "dm") sendTyping(source.conversationId);
							else sendChannelTyping(source.channelId);
						}}
						disabled={sendMut.isPending}
					/>
					<div className="flex shrink-0 items-center gap-1">
						<button
							type="button"
							className="flex size-9.5 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Emoji"
						>
							<SmileIcon className="size-4.5" />
						</button>
						<button
							type="submit"
							disabled={sendMut.isPending || !draft.trim()}
							className="flex size-9.5 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-[filter,transform] hover:brightness-110 disabled:opacity-50"
							aria-label="Send"
						>
							<SendHorizontalIcon className="size-4" />
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
