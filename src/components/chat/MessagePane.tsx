import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
	CheckIcon,
	ChevronLeftIcon,
	HashIcon,
	LogOutIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	SendHorizontalIcon,
	SmileIcon,
	SmilePlusIcon,
	TrashIcon,
	UserPlusIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePresence } from "@/components/contexts/PresenceProvider";
import { StorageImage } from "@/components/StorageImage";
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
import {
	EmojiPicker,
	EmojiPickerContent,
	EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
	editedAt?: string | Date | null;
	author?: {
		userId: string;
		profileUrl: string | null;
		displayName: string | null;
		name: string | null;
		avatarFileId: string | null;
	} | null;
	reactions?: { emoji: string; count: number; mine: boolean }[];
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
	const navigate = useNavigate();
	const [draft, setDraft] = useState("");
	const [showMembers, setShowMembers] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [renameDraft, setRenameDraft] = useState("");
	const [adding, setAdding] = useState(false);
	const [toAdd, setToAdd] = useState<Set<string>>(new Set());
	const [leaving, setLeaving] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editDraft, setEditDraft] = useState("");
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [reactingId, setReactingId] = useState<string | null>(null);
	const [composerEmoji, setComposerEmoji] = useState(false);
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
	const conversation = useQuery({
		...orpc.message.conversationById.queryOptions({
			input: { conversationId: dmConversationId },
		}),
		enabled: source.kind === "dm",
	});
	const channelInfo = useQuery({
		...orpc.channel.byId.queryOptions({ input: { channelId } }),
		enabled: source.kind === "channel",
	});
	const myChannelRole = useQuery({
		...orpc.community.myRoleIn.queryOptions({
			input: { communityId: channelInfo.data?.communityId ?? "" },
		}),
		enabled: source.kind === "channel" && !!channelInfo.data?.communityId,
	});
	const canModerate =
		myChannelRole.data?.role === "owner" ||
		myChannelRole.data?.role === "admin" ||
		myChannelRole.data?.role === "moderator";

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

	const invalidateThread = async () => {
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
	};

	const editMut = useMutation({
		mutationFn: (vars: { id: string; body: string }) =>
			client.message.edit({ messageId: vars.id, body: vars.body }),
		onSuccess: async () => {
			await invalidateThread();
			setEditingId(null);
			setEditDraft("");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => client.message.delete({ messageId: id }),
		onSuccess: async () => {
			await invalidateThread();
			setDeletingId(null);
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const reactMut = useMutation({
		mutationFn: (vars: { id: string; emoji: string }) =>
			client.message.react({ messageId: vars.id, emoji: vars.emoji }),
		onSuccess: () => invalidateThread(),
		onError: (e: Error) => toast.error(e.message),
	});

	const renameMut = useMutation({
		mutationFn: (name: string) =>
			client.message.rename({ conversationId: dmConversationId, name }),
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: orpc.message.conversationById.queryKey({
					input: { conversationId: dmConversationId },
				}),
			});
			await qc.invalidateQueries({
				queryKey: orpc.message.myConversations.key(),
			});
			setRenaming(false);
			toast.success("Group renamed");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const addMut = useMutation({
		mutationFn: (userIds: string[]) =>
			client.message.addParticipants({
				conversationId: dmConversationId,
				userIds,
			}),
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: orpc.message.participants.queryKey({
					input: { conversationId: dmConversationId },
				}),
			});
			await qc.invalidateQueries({
				queryKey: orpc.message.myConversations.key(),
			});
			setAdding(false);
			setToAdd(new Set());
			toast.success("Added to group");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const leaveMut = useMutation({
		mutationFn: () =>
			client.message.leave({ conversationId: dmConversationId }),
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: orpc.message.myConversations.key(),
			});
			navigate({ to: "/chat" });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const followingQ = useQuery({
		...orpc.follow.following.queryOptions({
			input: { page: 1, pageSize: 100 },
		}),
		enabled: adding,
	});

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
	}, [messages.data]);

	const parts: ParticipantInfo[] = participants.data ?? [];
	const byUser = new Map(parts.map((p) => [p.userId, p]));
	const meId = session?.user?.id;
	const others = parts.filter((p) => p.userId !== meId);
	const isGroup = source.kind === "dm" && others.length > 1;
	const partIds = new Set(parts.map((p) => p.userId));
	const candidates = (followingQ.data?.items ?? []).filter(
		(u) => !partIds.has(u.userId),
	);

	const nameOf = (userId: string) => {
		const p = byUser.get(userId);
		if (p) return p.displayName || p.name || p.profileUrl || userId.slice(0, 8);
		if (userId === meId) return session?.user?.name ?? "You";
		return userId.slice(0, 8);
	};

	const title =
		source.kind === "channel"
			? (channelInfo.data?.name ?? "…")
			: conversation.data?.name ||
				(others.length === 0
					? "Just you"
					: others
							.map((p) => p.displayName || p.name || p.profileUrl)
							.join(", "));
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
			<header className="flex h-15 shrink-0 items-center gap-3 border-b border-border px-4 md:px-5">
				<button
					type="button"
					onClick={() => navigate({ to: "/chat" })}
					aria-label="Back"
					className="-ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
				>
					<ChevronLeftIcon className="size-5" />
				</button>
				{source.kind === "channel" ? (
					<HashIcon className="size-5 text-muted-foreground" />
				) : others.length > 1 ? (
					<UsersIcon className="size-5 text-muted-foreground" />
				) : null}
				{isGroup ? (
					<button
						type="button"
						onClick={() => {
							setRenameDraft(conversation.data?.name ?? "");
							setRenaming(true);
						}}
						className="group/title flex min-w-0 items-center gap-1.5"
						aria-label="Rename group"
					>
						<span className="truncate text-base font-semibold text-foreground">
							{title}
						</span>
						<PencilIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-100" />
					</button>
				) : (
					<span className="truncate text-base font-semibold text-foreground">
						{title}
					</span>
				)}
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
					<div className="hidden w-48 cursor-text items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground md:flex">
						<SearchIcon className="size-3.5 opacity-80" />
						<span>Search</span>
					</div>
					<button
						type="button"
						onClick={() => navigate({ to: "/chat" })}
						aria-label="Close conversation"
						className="hidden size-8.5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
					>
						<XIcon className="size-4" />
					</button>
				</div>
			</header>

			<div className="relative flex min-h-0 flex-1">
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
								const isMine = m.senderId === meId;
								const canDelete =
									isMine || (source.kind === "channel" && canModerate);
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
										className={`group relative flex gap-4 rounded-md px-2 py-1 hover:bg-foreground/[0.015] ${
											grouped ? "" : "mt-1.5"
										}`}
									>
										{editingId === m.id ? null : (
											<div className="absolute right-2 top-0 flex items-center gap-0.5 rounded-md border border-border bg-card opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
												<Popover
													open={reactingId === m.id}
													onOpenChange={(o) => setReactingId(o ? m.id : null)}
												>
													<PopoverTrigger asChild>
														<button
															type="button"
															className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
															aria-label="Add reaction"
														>
															<SmilePlusIcon className="size-3.5" />
														</button>
													</PopoverTrigger>
													<PopoverContent
														className="chat-scope w-fit p-0"
														align="end"
													>
														<EmojiPicker
															className="h-[320px]"
															onEmojiSelect={({ emoji }) => {
																reactMut.mutate({ id: m.id, emoji });
																setReactingId(null);
															}}
														>
															<EmojiPickerSearch />
															<EmojiPickerContent />
														</EmojiPicker>
													</PopoverContent>
												</Popover>
												{isMine ? (
													<button
														type="button"
														onClick={() => {
															setEditingId(m.id);
															setEditDraft(m.body);
														}}
														className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
														aria-label="Edit message"
													>
														<PencilIcon className="size-3.5" />
													</button>
												) : null}
												{canDelete ? (
													<button
														type="button"
														onClick={() => setDeletingId(m.id)}
														className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
														aria-label="Delete message"
													>
														<TrashIcon className="size-3.5" />
													</button>
												) : null}
											</div>
										)}
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
											{editingId === m.id ? (
												<form
													onSubmit={(e) => {
														e.preventDefault();
														const body = editDraft.trim();
														if (body && body !== m.body)
															editMut.mutate({ id: m.id, body });
														else setEditingId(null);
													}}
													className="mt-0.5"
												>
													<input
														className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground focus:border-ring focus:outline-none"
														value={editDraft}
														onChange={(e) => setEditDraft(e.target.value)}
														onKeyDown={(e) => {
															if (e.key === "Escape") setEditingId(null);
														}}
														maxLength={10000}
														// biome-ignore lint/a11y/noAutofocus: inline editor focus is expected
														autoFocus
													/>
													<div className="mt-1 flex gap-2 text-xs text-muted-foreground">
														<button
															type="button"
															className="underline"
															onClick={() => setEditingId(null)}
														>
															cancel
														</button>
														<button
															type="submit"
															className="underline"
															disabled={editMut.isPending}
														>
															save
														</button>
													</div>
												</form>
											) : (
												<div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
													{m.body}
													{m.editedAt ? (
														<span className="ml-1.5 text-[10px] text-muted-foreground">
															(edited)
														</span>
													) : null}
												</div>
											)}
											{editingId === m.id ? null : m.reactions &&
												m.reactions.length > 0 ? (
												<div className="mt-1 flex flex-wrap gap-1">
													{m.reactions.map((r) => (
														<button
															key={r.emoji}
															type="button"
															onClick={() =>
																reactMut.mutate({ id: m.id, emoji: r.emoji })
															}
															className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
																r.mine
																	? "border-primary/40 bg-primary/15 text-foreground"
																	: "border-border bg-card text-muted-foreground hover:bg-muted"
															}`}
														>
															<span className="text-sm leading-none">
																{r.emoji}
															</span>
															<span className="tabular-nums">{r.count}</span>
														</button>
													))}
												</div>
											) : null}
										</div>
									</div>
								);
							})}
						</>
					)}
				</div>

				{showMembers ? (
					<aside className="absolute inset-0 z-20 w-full overflow-y-auto border-l border-border bg-background px-3 py-4 md:static md:inset-auto md:w-56 md:shrink-0">
						{isGroup ? (
							<div className="mb-3 flex flex-col gap-1.5 border-b border-border px-2 pb-3">
								<button
									type="button"
									onClick={() => {
										setRenameDraft(conversation.data?.name ?? "");
										setRenaming(true);
									}}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<PencilIcon className="size-4 shrink-0" /> Rename group
								</button>
								<button
									type="button"
									onClick={() => {
										setToAdd(new Set());
										setAdding(true);
									}}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<UserPlusIcon className="size-4 shrink-0" /> Add people
								</button>
								<button
									type="button"
									onClick={() => setLeaving(true)}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
								>
									<LogOutIcon className="size-4 shrink-0" /> Leave group
								</button>
							</div>
						) : null}
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
						<Popover open={composerEmoji} onOpenChange={setComposerEmoji}>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex size-9.5 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									aria-label="Emoji"
								>
									<SmileIcon className="size-4.5" />
								</button>
							</PopoverTrigger>
							<PopoverContent
								className="chat-scope w-fit p-0"
								align="end"
								side="top"
							>
								<EmojiPicker
									className="h-[320px]"
									onEmojiSelect={({ emoji }) => {
										setDraft((d) => d + emoji);
										setComposerEmoji(false);
									}}
								>
									<EmojiPickerSearch />
									<EmojiPickerContent />
								</EmojiPicker>
							</PopoverContent>
						</Popover>
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

			<Dialog open={renaming} onOpenChange={setRenaming}>
				<DialogContent className="chat-scope max-w-sm">
					<DialogHeader>
						<DialogTitle>Rename group</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							const trimmed = renameDraft.trim();
							if (trimmed) renameMut.mutate(trimmed);
						}}
					>
						<Input
							value={renameDraft}
							onChange={(e) => setRenameDraft(e.target.value)}
							maxLength={100}
							autoFocus
							placeholder="Group name"
						/>
						<DialogFooter className="mt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setRenaming(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={renameMut.isPending || !renameDraft.trim()}
							>
								Save
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={adding} onOpenChange={setAdding}>
				<DialogContent className="chat-scope max-w-md">
					<DialogHeader>
						<DialogTitle>Add people</DialogTitle>
					</DialogHeader>
					<div className="max-h-72 overflow-y-auto">
						{followingQ.isPending ? (
							<p className="px-1 py-2 text-sm text-muted-foreground">
								Loading…
							</p>
						) : candidates.length === 0 ? (
							<p className="px-1 py-2 text-sm text-muted-foreground">
								No one left to add.
							</p>
						) : (
							candidates.map((u) => {
								const selected = toAdd.has(u.userId);
								const label = u.displayName || u.name || "User";
								return (
									<button
										key={u.userId}
										type="button"
										onClick={() =>
											setToAdd((prev) => {
												const next = new Set(prev);
												if (next.has(u.userId)) next.delete(u.userId);
												else next.add(u.userId);
												return next;
											})
										}
										className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
											selected
												? "bg-primary/15 text-foreground"
												: "text-foreground hover:bg-muted"
										}`}
									>
										<StorageImage
											kind="avatar"
											fileId={u.avatarFileId}
											variant="sm"
											className="size-7 rounded-full object-cover bg-muted"
											fallback={
												<div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
													{initials(label)}
												</div>
											}
										/>
										<span className="flex-1 truncate">{label}</span>
										{selected ? (
											<CheckIcon className="size-4 shrink-0 text-primary" />
										) : null}
									</button>
								);
							})
						)}
					</div>
					<DialogFooter className="mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setAdding(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={addMut.isPending || toAdd.size === 0}
							onClick={() => addMut.mutate([...toAdd])}
						>
							Add
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={leaving} onOpenChange={setLeaving}>
				<AlertDialogContent className="chat-scope">
					<AlertDialogHeader>
						<AlertDialogTitle>Leave this group?</AlertDialogTitle>
						<AlertDialogDescription>
							You'll stop receiving its messages and won't be able to rejoin
							unless someone adds you back.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={(e) => {
								e.preventDefault();
								leaveMut.mutate();
							}}
							disabled={leaveMut.isPending}
						>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={!!deletingId}
				onOpenChange={(o) => {
					if (!o) setDeletingId(null);
				}}
			>
				<AlertDialogContent className="chat-scope">
					<AlertDialogHeader>
						<AlertDialogTitle>Delete message?</AlertDialogTitle>
						<AlertDialogDescription>
							This permanently removes the message for everyone. This cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={(e) => {
								e.preventDefault();
								if (deletingId) deleteMut.mutate(deletingId);
							}}
							disabled={deleteMut.isPending}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
