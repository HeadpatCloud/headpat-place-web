import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDateFormat } from "@/lib/datetime";
import { client, orpc } from "@/lib/orpc";
import { uploadTicketAttachment } from "@/lib/ticket-attachments";
import { cn } from "@/lib/utils";
import { TicketAttachInput } from "./TicketAttachInput";
import { TicketAttachment } from "./TicketAttachment";

export function TicketThread({ ticketId }: { ticketId: string }) {
	const qc = useQueryClient();
	const fmt = useDateFormat();
	const [reply, setReply] = useState("");
	const [files, setFiles] = useState<File[]>([]);

	const ticket = useQuery(
		orpc.ticket.get.queryOptions({ input: { ticketId } }),
	);
	const scrollRef = useRef<HTMLDivElement>(null);

	const messageCount = ticket.data?.messages.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom when the message count changes
	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messageCount]);

	function refresh() {
		qc.invalidateQueries({
			queryKey: orpc.ticket.get.queryKey({ input: { ticketId } }),
		});
		qc.invalidateQueries({
			queryKey: orpc.ticket.myList.queryKey({ input: undefined }),
		});
	}

	const send = useMutation({
		mutationFn: async () => {
			const keys: string[] = [];
			for (const f of files) {
				try {
					keys.push((await uploadTicketAttachment(ticketId, f)).key);
				} catch {
					toast.error(`Couldn't upload ${f.name}.`);
				}
			}
			const trimmed = reply.trim();
			if (!trimmed && keys.length === 0) {
				throw new Error("Add a message or an attachment first.");
			}
			return client.ticket.reply({
				ticketId,
				body: trimmed || undefined,
				attachments: keys,
			});
		},
		onSuccess: () => {
			setReply("");
			setFiles([]);
			refresh();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const setStatus = useMutation({
		mutationFn: (status: "open" | "closed") =>
			client.ticket.setStatus({ ticketId, status }),
		onSuccess: () => refresh(),
		onError: (e: Error) => toast.error(e.message),
	});

	if (ticket.isPending) {
		return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
	}
	if (!ticket.data) return null;
	const t = ticket.data;
	const isClosed = t.status === "closed";
	const canSend =
		(reply.trim().length > 0 || files.length > 0) && !send.isPending;

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-start gap-3 border-b border-border p-4">
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-lg font-semibold tracking-tight">
						{t.subject}
					</h2>
					<p className="mt-0.5 text-xs text-muted-foreground">
						#{t.id.slice(0, 8)} · {t.category} · {t.priority} · opened{" "}
						{fmt.date(t.createdAt)}
					</p>
				</div>
				<Badge
					className={cn(
						isClosed
							? "bg-muted text-muted-foreground"
							: "bg-primary/15 text-primary hover:bg-primary/15",
					)}
				>
					{t.status}
				</Badge>
				<Button
					variant="outline"
					size="sm"
					disabled={setStatus.isPending}
					onClick={() => setStatus.mutate(isClosed ? "open" : "closed")}
				>
					{isClosed ? "Reopen" : "Close"}
				</Button>
			</div>

			<div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
				{t.messages.map((m) => (
					<div
						key={m.id}
						className={cn(
							"flex flex-col gap-1.5",
							m.isStaff ? "items-start" : "items-end",
						)}
					>
						<div className="text-xs text-muted-foreground">
							{m.isStaff ? "Staff" : "You"} · {fmt.dateTime(m.createdAt)}
						</div>
						{m.body ? (
							<div
								className={cn(
									"max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
									m.isStaff
										? "bg-muted text-foreground"
										: "bg-primary text-primary-foreground",
								)}
							>
								{m.body}
							</div>
						) : null}
						{(m.attachments ?? []).length > 0 ? (
							<div className="flex max-w-[80%] flex-wrap gap-2">
								{(m.attachments ?? []).map((k) => (
									<TicketAttachment key={k} attachmentKey={k} />
								))}
							</div>
						) : null}
					</div>
				))}
			</div>

			<div className="border-t border-border p-4">
				{isClosed ? (
					<div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
						<span>This ticket is closed.</span>
						<Button
							variant="outline"
							size="sm"
							disabled={setStatus.isPending}
							onClick={() => setStatus.mutate("open")}
						>
							Reopen to reply
						</Button>
					</div>
				) : (
					<div className="space-y-2">
						<Textarea
							value={reply}
							onChange={(e) => setReply(e.target.value)}
							placeholder="Write a reply…"
							className="min-h-[80px]"
							maxLength={10000}
						/>
						<div className="flex items-center justify-between gap-3">
							<TicketAttachInput
								files={files}
								onChange={setFiles}
								disabled={send.isPending}
							/>
							<Button disabled={!canSend} onClick={() => send.mutate()}>
								{send.isPending ? "Sending…" : "Reply"}
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
