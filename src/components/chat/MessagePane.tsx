import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckIcon,
	ChevronLeftIcon,
	FileIcon,
	HashIcon,
	Loader2Icon,
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
import { MessageAttachment } from "@/components/chat/MessageAttachment";
import {
	addOutgoing,
	type OutgoingMessage,
	removeOutgoing,
	setOutgoingStatus,
} from "@/components/chat/outgoing-messages";
import { ReactionPill } from "@/components/chat/ReactionPill";
import { ReactionsModal } from "@/components/chat/ReactionsModal";
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
import {
	type UploadedAttachment,
	uploadAttachment,
} from "@/lib/chat-attachments";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { useRecentChats } from "@/lib/use-recent-chats";

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
	attachments?: string[];
};

function initials(name: string): string {
	return (name.trim().charAt(0) || "?").toUpperCase();
}

export function MessagePane({ source }: { source: Source }) {
	const sourceId =
		source.kind === "dm" ? source.conversationId : source.channelId;
	const t = useTranslations("chatUi");
	const c = useTranslations("common");
	const { data: session } = useSession();
	const { typingIn, sendTyping, sendChannelTyping } = usePresence();
	const qc = useQueryClient();
	const fmt = useDateFormat();
	const navigate = useNavigate();
	const recents = useRecentChats();
	const draftLoadedRef = useRef(false);
	const [draft, setDraft] = useState("");
	const [showMembers, setShowMembers] = useState(false);
	const membersLoadedRef = useRef(false);
	// persist the members panel open/closed across conversation switches
	// (MessagePane remounts per conversation, so restore/save it via localStorage)
	useEffect(() => {
		if (typeof localStorage === "undefined") return;
		if (!membersLoadedRef.current) {
			membersLoadedRef.current = true;
			setShowMembers(localStorage.getItem("hp-chat-members-open") === "1");
			return;
		}
		localStorage.setItem("hp-chat-members-open", showMembers ? "1" : "0");
	}, [showMembers]);
	const [renaming, setRenaming] = useState(false);
	const [renameDraft, setRenameDraft] = useState("");
	const [adding, setAdding] = useState(false);
	const [toAdd, setToAdd] = useState<Set<string>>(new Set());
	const [leaving, setLeaving] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editDraft, setEditDraft] = useState("");
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [reactingId, setReactingId] = useState<string | null>(null);
	const [reactorsModal, setReactorsModal] = useState<{
		messageId: string;
		emoji: string;
	} | null>(null);
	const [composerEmoji, setComposerEmoji] = useState(false);
	const [pending, setPending] = useState<
		{
			id: string;
			name: string;
			mimeType: string;
			size: number;
			key?: string;
			status: "uploading" | "done" | "error";
		}[]
	>([]);
	const [outgoing, setOutgoing] = useState<OutgoingMessage[]>([]);
	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const dmConversationId =
		source.kind === "dm" ? source.conversationId : "__none__";
	const channelId = source.kind === "channel" ? source.channelId : "__none__";

	const draftQ = useQuery({
		...orpc.draft.get.queryOptions({
			input: { kind: source.kind, targetId: sourceId },
		}),
		// global staleTime is 60s; the draft must be fresh each time a
		// conversation opens or a saved draft fails to restore on quick switch.
		staleTime: 0,
		refetchOnMount: "always",
	});

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

	const sendMut = useMutation({
		mutationFn: async (vars: {
			body: string;
			attachments: string[];
			tempId: string;
		}) =>
			source.kind === "dm"
				? client.message.send({
						conversationId: source.conversationId,
						body: vars.body || undefined,
						attachments: vars.attachments.length ? vars.attachments : undefined,
					})
				: client.channel.send({
						channelId: source.channelId,
						body: vars.body || undefined,
						attachments: vars.attachments.length ? vars.attachments : undefined,
					}),
		onSuccess: async (_data, vars) => {
			await invalidateThread();
			setOutgoing((o) => removeOutgoing(o, vars.tempId));
		},
		onError: (_e, vars) =>
			setOutgoing((o) => setOutgoingStatus(o, vars.tempId, "failed")),
	});

	function onPickFiles(files: FileList | null) {
		if (!files) return;
		for (const file of Array.from(files)) {
			const id = crypto.randomUUID();
			setPending((p) => [
				...p,
				{
					id,
					name: file.name,
					mimeType: file.type || "application/octet-stream",
					size: file.size,
					status: "uploading",
				},
			]);
			uploadAttachment(sourceId, file)
				.then((res: UploadedAttachment) =>
					setPending((p) =>
						p.map((x) =>
							x.id === id
								? { ...x, key: res.key, mimeType: res.mimeType, status: "done" }
								: x,
						),
					),
				)
				.catch((e: Error) => {
					toast.error(e.message);
					setPending((p) => p.filter((x) => x.id !== id));
				});
		}
	}

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
		onSuccess: async (_data, vars) => {
			await invalidateThread();
			await qc.invalidateQueries({
				queryKey: orpc.message.reactors.queryKey({
					input: { messageId: vars.id },
				}),
			});
		},
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
			toast.success(t("groupRenamed"));
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
			toast.success(t("addedToGroup"));
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

	useEffect(() => {
		draftLoadedRef.current = false;
		recents.push(source.kind, sourceId);
	}, [source.kind, sourceId, recents.push]);

	useEffect(() => {
		if (draftLoadedRef.current) return;
		// wait for the forced refetch (staleTime:0) to land, not just the initial
		// load — isLoading is false when a stale cached entry exists.
		if (draftQ.isFetching) return;
		draftLoadedRef.current = true;
		const body = draftQ.data?.body;
		// never clobber what the user is already typing
		if (body && draft.trim() === "") setDraft(body);
	}, [draftQ.isFetching, draftQ.data, draft]);

	useEffect(() => {
		if (!draftLoadedRef.current) return;
		const kind = source.kind;
		const targetId = sourceId;
		const h = setTimeout(() => {
			void client.draft.upsert({ kind, targetId, body: draft });
		}, 600);
		return () => clearTimeout(h);
	}, [draft, source.kind, sourceId]);

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
		if (userId === meId) return session?.user?.name ?? t("youCapitalized");
		return userId.slice(0, 8);
	};

	const title =
		source.kind === "channel"
			? (channelInfo.data?.name ?? "…")
			: conversation.data?.name ||
				(others.length === 0
					? t("justYou")
					: others
							.map((p) => p.displayName || p.name || p.profileUrl)
							.join(", "));
	const topic =
		source.kind === "channel" ? (channelInfo.data?.topic ?? null) : null;
	const placeholder =
		source.kind === "channel"
			? t("messageChannelPlaceholder", {
					channel: channelInfo.data?.name ?? t("channelFallback"),
				})
			: t("messageNamePlaceholder", { name: title });

	const typers = typingIn(sourceId).filter((id) => id !== meId);

	function onSend() {
		const body = draft.trim();
		const attachments = pending
			.filter((p) => p.status === "done" && p.key)
			.map((p) => p.key as string);
		if (!body && attachments.length === 0) return;
		if (pending.some((p) => p.status === "uploading")) return;
		setDraft("");
		setPending([]);
		void client.draft.delete({ kind: source.kind, targetId: sourceId });
		const tempId = crypto.randomUUID();
		setOutgoing((o) =>
			addOutgoing(o, {
				tempId,
				body,
				attachments,
				createdAt: Date.now(),
				status: "sending",
			}),
		);
		sendMut.mutate({ body, attachments, tempId });
	}

	const list = (messages.data ?? []) as Msg[];

	return (
		<div className="flex h-full flex-col bg-background text-foreground">
			<header className="flex h-15 shrink-0 items-center gap-3 border-b border-border px-4 md:px-5">
				<button
					type="button"
					onClick={() => navigate({ to: "/chat" })}
					aria-label={c("back")}
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
						aria-label={t("renameGroup")}
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
						aria-label={t("toggleMembers")}
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
						<span>{c("search")}</span>
					</div>
					<button
						type="button"
						onClick={() => {
							if (isGroup) setLeaving(true);
							else navigate({ to: "/chat" });
						}}
						aria-label={isGroup ? t("leaveGroup") : t("closeConversation")}
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
						<p className="py-4 text-muted-foreground">{t("loadingMessages")}</p>
					) : list.length === 0 && outgoing.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground">
							{t("noMessagesYet")}
						</p>
					) : (
						<>
							<div className="my-4 flex items-center gap-3.5">
								<span className="h-px flex-1 bg-border" />
								<span className="text-xs font-semibold text-muted-foreground">
									{t("today")}
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
									? (session?.user?.name ?? t("youCapitalized"))
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
															aria-label={t("addReaction")}
														>
															<SmilePlusIcon className="size-3.5" />
														</button>
													</PopoverTrigger>
													<PopoverContent className="w-fit p-0" align="end">
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
														aria-label={t("editMessage")}
													>
														<PencilIcon className="size-3.5" />
													</button>
												) : null}
												{canDelete ? (
													<button
														type="button"
														onClick={() => setDeletingId(m.id)}
														className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
														aria-label={t("deleteMessage")}
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
															{t("editCancel")}
														</button>
														<button
															type="submit"
															className="underline"
															disabled={editMut.isPending}
														>
															{t("editSave")}
														</button>
													</div>
												</form>
											) : (
												<div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
													{m.body}
													{m.editedAt ? (
														<span className="ml-1.5 text-[10px] text-muted-foreground">
															{t("edited")}
														</span>
													) : null}
												</div>
											)}
											{m.attachments && m.attachments.length > 0 ? (
												<div className="mt-1.5 flex flex-col gap-1.5">
													{m.attachments.map((k) => (
														<MessageAttachment key={k} attachmentKey={k} />
													))}
												</div>
											) : null}
											{editingId === m.id ? null : m.reactions &&
												m.reactions.length > 0 ? (
												<div className="mt-1 flex flex-wrap gap-1">
													{m.reactions.map((r) => (
														<ReactionPill
															key={r.emoji}
															messageId={m.id}
															emoji={r.emoji}
															count={r.count}
															mine={r.mine}
															onReact={(emoji) =>
																reactMut.mutate({ id: m.id, emoji })
															}
															onOpenModal={(emoji) =>
																setReactorsModal({ messageId: m.id, emoji })
															}
														/>
													))}
												</div>
											) : null}
										</div>
									</div>
								);
							})}
							{outgoing.map((o) => {
								const failed = o.status === "failed";
								return (
									<div
										key={o.tempId}
										className="group relative mt-1.5 flex gap-4 rounded-md px-2 py-1"
									>
										<div className="w-10.5 shrink-0">
											<StorageImage
												kind="avatar"
												fileId={byUser.get(meId ?? "")?.avatarFileId}
												variant="md"
												className="size-10.5 rounded-full object-cover bg-muted"
												fallback={
													<div className="flex size-10.5 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
														{initials(
															session?.user?.name ?? t("youCapitalized"),
														)}
													</div>
												}
											/>
										</div>
										<div className="min-w-0 flex-1">
											<div className="mb-1 flex items-baseline gap-2.5">
												<span className="text-sm font-semibold text-foreground">
													{session?.user?.name ?? t("youCapitalized")}
												</span>
												<span className="text-xs text-muted-foreground">
													{failed ? t("sendFailed") : t("sending")}
												</span>
											</div>
											<div
												className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
													failed
														? "text-destructive"
														: "animate-pulse text-muted-foreground"
												}`}
											>
												{o.body}
											</div>
											{o.attachments.length > 0 ? (
												<div className="mt-1 text-xs text-muted-foreground">
													{o.attachments.length === 1
														? t("fileFallback")
														: `${o.attachments.length} × ${t("fileFallback")}`}
												</div>
											) : null}
											{failed ? (
												<div className="mt-1 flex gap-2 text-xs">
													<button
														type="button"
														className="text-primary underline"
														onClick={() => {
															setOutgoing((arr) =>
																setOutgoingStatus(arr, o.tempId, "sending"),
															);
															sendMut.mutate({
																body: o.body,
																attachments: o.attachments,
																tempId: o.tempId,
															});
														}}
													>
														{t("resend")}
													</button>
													<button
														type="button"
														className="text-muted-foreground underline"
														onClick={() =>
															setOutgoing((arr) =>
																removeOutgoing(arr, o.tempId),
															)
														}
														aria-label={c("cancel")}
													>
														×
													</button>
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
									<PencilIcon className="size-4 shrink-0" /> {t("renameGroup")}
								</button>
								<button
									type="button"
									onClick={() => {
										setToAdd(new Set());
										setAdding(true);
									}}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
								>
									<UserPlusIcon className="size-4 shrink-0" /> {t("addPeople")}
								</button>
								<button
									type="button"
									onClick={() => setLeaving(true)}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
								>
									<LogOutIcon className="size-4 shrink-0" /> {t("leaveGroup")}
								</button>
							</div>
						) : null}
						<div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							{t("membersHeading")}
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
								{t("memberListComingSoon")}
							</p>
						)}
					</aside>
				) : null}
			</div>

			<div className="shrink-0 px-5 pb-5 pt-1.5">
				{typers.length > 0 ? (
					<div className="px-1 pb-1 text-xs text-muted-foreground">
						{source.kind === "dm"
							? typers.length === 1
								? t("typingOne", {
										names: typers.map((id) => nameOf(id)).join(", "),
									})
								: t("typingMany", {
										names: typers.map((id) => nameOf(id)).join(", "),
									})
							: typers.length === 1
								? t("typingSomeone")
								: t("typingNPeople", { count: typers.length })}
					</div>
				) : null}
				{pending.length > 0 ? (
					<div className="mb-2 flex flex-wrap gap-2">
						{pending.map((p) => (
							<div
								key={p.id}
								className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
							>
								{p.status === "uploading" ? (
									<Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
								) : (
									<FileIcon className="size-3.5 text-muted-foreground" />
								)}
								<span className="max-w-40 truncate">{p.name}</span>
								<button
									type="button"
									onClick={() =>
										setPending((arr) => arr.filter((x) => x.id !== p.id))
									}
									aria-label={t("removeAttachment")}
									className="text-muted-foreground hover:text-foreground"
								>
									<XIcon className="size-3.5" />
								</button>
							</div>
						))}
					</div>
				) : null}
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="hidden"
					onChange={(e) => {
						onPickFiles(e.target.files);
						e.target.value = "";
					}}
				/>
				<form
					className="flex items-center gap-3 rounded-2xl border border-border bg-card px-1.5 py-1.5 transition-colors focus-within:border-ring"
					onSubmit={(e) => {
						e.preventDefault();
						onSend();
					}}
				>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="flex size-9.5 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label={t("attach")}
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
									aria-label={t("emoji")}
								>
									<SmileIcon className="size-4.5" />
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-fit p-0" align="end" side="top">
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
							disabled={
								sendMut.isPending ||
								(!draft.trim() &&
									pending.filter((p) => p.status === "done").length === 0)
							}
							className="flex size-9.5 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-[filter,transform] hover:brightness-110 disabled:opacity-50"
							aria-label={t("send")}
						>
							<SendHorizontalIcon className="size-4" />
						</button>
					</div>
				</form>
			</div>

			<Dialog open={renaming} onOpenChange={setRenaming}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t("renameGroupTitle")}</DialogTitle>
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
							placeholder={t("groupNameField")}
						/>
						<DialogFooter className="mt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setRenaming(false)}
							>
								{c("cancel")}
							</Button>
							<Button
								type="submit"
								disabled={renameMut.isPending || !renameDraft.trim()}
							>
								{c("save")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={adding} onOpenChange={setAdding}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{t("addPeopleTitle")}</DialogTitle>
					</DialogHeader>
					<div className="max-h-72 overflow-y-auto">
						{followingQ.isPending ? (
							<p className="px-1 py-2 text-sm text-muted-foreground">
								{c("loading")}
							</p>
						) : candidates.length === 0 ? (
							<p className="px-1 py-2 text-sm text-muted-foreground">
								{t("noOneLeftToAdd")}
							</p>
						) : (
							candidates.map((u) => {
								const selected = toAdd.has(u.userId);
								const label = u.displayName || u.name || t("userFallback");
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
							{c("cancel")}
						</Button>
						<Button
							type="button"
							disabled={addMut.isPending || toAdd.size === 0}
							onClick={() => addMut.mutate([...toAdd])}
						>
							{t("add")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={leaving} onOpenChange={setLeaving}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("leaveGroupConfirm")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("leaveGroupDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={(e) => {
								e.preventDefault();
								leaveMut.mutate();
							}}
							disabled={leaveMut.isPending}
						>
							{t("leave")}
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
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteMessageConfirm")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteMessageDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={(e) => {
								e.preventDefault();
								if (deletingId) deleteMut.mutate(deletingId);
							}}
							disabled={deleteMut.isPending}
						>
							{c("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<ReactionsModal
				open={!!reactorsModal}
				onOpenChange={(o) => {
					if (!o) setReactorsModal(null);
				}}
				messageId={reactorsModal?.messageId ?? "__none__"}
				initialEmoji={reactorsModal?.emoji ?? null}
			/>
		</div>
	);
}
