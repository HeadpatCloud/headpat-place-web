import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePresence } from "@/components/contexts/PresenceProvider";
import { StorageImage } from "@/components/StorageImage";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/lib/auth-client";
import { useDateFormat } from "@/lib/datetime";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_app/messages/$conversationId")({
	component: ConversationPage,
});

function ConversationPage() {
	const { conversationId } = Route.useParams();
	const { data: session } = useSession();
	const { typingIn, sendTyping } = usePresence();
	const qc = useQueryClient();
	const fmt = useDateFormat();
	const [draft, setDraft] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	const conversation = useQuery(
		orpc.message.conversationById.queryOptions({ input: { conversationId } }),
	);
	const participants = useQuery(
		orpc.message.participants.queryOptions({ input: { conversationId } }),
	);
	const messages = useQuery({
		...orpc.message.list.queryOptions({
			input: { conversationId, limit: 200 },
		}),
		// live delivery is the primary path (websocket); this is a slow safety net
		refetchInterval: 15000,
	});

	const sendMut = useMutation({
		mutationFn: async (body: string) =>
			client.message.send({ conversationId, body }),
		onSuccess: async () => {
			setDraft("");
			await qc.invalidateQueries({
				queryKey: orpc.message.list.queryKey({
					input: { conversationId, limit: 200 },
				}),
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
	}, [messages.data]);

	if (conversation.isPending) {
		return <p className="p-4 text-muted-foreground">Loading…</p>;
	}
	if (conversation.isError || !conversation.data) {
		return <p className="p-4">Not found or not a participant.</p>;
	}

	const parts = participants.data ?? [];
	const others = parts.filter((p) => p.userId !== session?.user?.id);
	const byUser = new Map(parts.map((p) => [p.userId, p]));
	const nameOf = (userId: string) => {
		const p = byUser.get(userId);
		return p ? p.displayName || p.name || p.profileUrl : userId.slice(0, 8);
	};

	return (
		<main className="mx-auto max-w-3xl">
			<Card className="flex h-[80vh] flex-col">
				<CardHeader>
					<CardTitle className="text-base">
						{others.length === 0
							? "Just you"
							: others
									.map((p) => p.displayName || p.name || p.profileUrl)
									.join(", ")}
					</CardTitle>
				</CardHeader>
				<Separator />
				<CardContent
					ref={scrollRef}
					className="flex-1 overflow-y-auto space-y-3 py-4"
				>
					{messages.isPending ? (
						<p className="text-muted-foreground">Loading messages…</p>
					) : (messages.data ?? []).length === 0 ? (
						<p className="text-muted-foreground text-center">
							No messages yet. Say hi.
						</p>
					) : (
						(messages.data ?? []).map((m) => {
							const mine = m.senderId === session?.user?.id;
							return (
								<div
									key={m.id}
									className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
								>
									{!mine && (
										<StorageImage
											kind="avatar"
											fileId={byUser.get(m.senderId)?.avatarFileId}
											variant="sm"
											className="h-6 w-6 shrink-0 rounded-md border border-border bg-muted"
											fallback={
												<div className="h-6 w-6 shrink-0 rounded-md border border-border bg-muted" />
											}
										/>
									)}
									<div
										className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
											mine ? "bg-primary text-primary-foreground" : "bg-muted"
										}`}
									>
										{!mine ? (
											<div className="text-xs font-medium opacity-70 mb-0.5">
												{nameOf(m.senderId)}
											</div>
										) : null}
										<div className="whitespace-pre-wrap break-words">
											{m.body}
										</div>
										<div
											className={`text-[10px] mt-1 ${
												mine ? "opacity-70" : "text-muted-foreground"
											}`}
										>
											{fmt.time(m.createdAt, {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</div>
									</div>
								</div>
							);
						})
					)}
				</CardContent>
				<Separator />
				<CardFooter className="py-3 flex-col items-stretch">
					{(() => {
						const meId = session?.user?.id;
						const typers = typingIn(conversationId).filter((id) => id !== meId);
						if (typers.length === 0) return null;
						const names = typers.map((id) => {
							const p = (participants.data ?? []).find((u) => u.userId === id);
							return p?.displayName || p?.name || "Someone";
						});
						const label =
							names.length === 1
								? `${names[0]} is typing…`
								: `${names.join(", ")} are typing…`;
						return (
							<div className="px-1 pb-1 text-xs text-muted-foreground">
								{label}
							</div>
						);
					})()}
					<form
						className="flex w-full gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							if (!draft.trim()) return;
							sendMut.mutate(draft.trim());
						}}
					>
						<Input
							placeholder="Type a message…"
							value={draft}
							onChange={(e) => {
								setDraft(e.target.value);
								sendTyping(conversationId);
							}}
							disabled={sendMut.isPending}
						/>
						<Button type="submit" disabled={sendMut.isPending || !draft.trim()}>
							Send
						</Button>
					</form>
				</CardFooter>
			</Card>
		</main>
	);
}
