import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStorageUrl } from "@/components/StorageImage";
import { TicketAttachInput } from "@/components/tickets/TicketAttachInput";
import { TicketAttachment } from "@/components/tickets/TicketAttachment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { uploadTicketAttachment } from "@/lib/ticket-attachments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/{-$locale}/admin/tickets/$ticketId")({
	component: AdminTicketThread,
});

function AdminTicketThread() {
	const tr = useTranslations("adminPanel");
	const c = useTranslations("common");
	const { ticketId } = Route.useParams();
	const qc = useQueryClient();
	const fmt = useDateFormat();
	const [reply, setReply] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const scrollRef = useRef<HTMLDivElement>(null);

	const ticket = useQuery(
		orpc.ticket.get.queryOptions({ input: { ticketId } }),
	);
	const ownerId = ticket.data?.userId;
	const owner = useQuery({
		...orpc.profile.byId.queryOptions({ input: { userId: ownerId ?? "" } }),
		enabled: !!ownerId,
	});
	const ownerAvatar = useStorageUrl("avatar", owner.data?.avatarFileId, "md");

	const messageCount = ticket.data?.messages.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messageCount]);

	function invalidate() {
		qc.invalidateQueries({
			queryKey: orpc.ticket.get.queryKey({ input: { ticketId } }),
		});
		qc.invalidateQueries({ queryKey: orpc.ticket.adminList.key() });
	}

	const send = useMutation({
		mutationFn: async () => {
			const keys: string[] = [];
			for (const f of files) {
				try {
					keys.push((await uploadTicketAttachment(ticketId, f)).key);
				} catch {
					toast.error(tr("uploadFailed", { name: f.name }));
				}
			}
			const trimmed = reply.trim();
			if (!trimmed && keys.length === 0) {
				throw new Error(tr("addMessageOrAttachment"));
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
			invalidate();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const setStatus = useMutation({
		mutationFn: (status: "open" | "closed") =>
			client.ticket.setStatus({ ticketId, status }),
		onSuccess: () => invalidate(),
		onError: (e: Error) => toast.error(e.message),
	});

	if (ticket.isError) {
		return <p className="p-4 text-muted-foreground">{tr("noAccess")}</p>;
	}
	if (ticket.isPending) {
		return <p className="p-4 text-muted-foreground">{c("loading")}</p>;
	}
	if (!ticket.data) return <p className="p-4">{tr("ticketNotFound")}</p>;

	const t = ticket.data;
	const isClosed = t.status === "closed";
	const ownerName =
		owner.data?.displayName ||
		owner.data?.name ||
		owner.data?.profileUrl ||
		tr("userFallback");
	const canSend =
		(reply.trim().length > 0 || files.length > 0) && !send.isPending;

	return (
		<div className="mx-auto max-w-5xl space-y-4">
			<Link
				to={"/admin/tickets" as never}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" /> {tr("allTickets")}
			</Link>

			<div className="overflow-hidden rounded-xl border border-border bg-card">
				<div className="flex flex-wrap items-start gap-3 border-b border-border p-4">
					<div className="min-w-0 flex-1">
						<h1 className="truncate text-lg font-semibold tracking-tight">
							{t.subject}
						</h1>
						<p className="mt-0.5 text-xs text-muted-foreground">
							#{t.id.slice(0, 8)} · {t.category} · {t.priority} · {tr("opened")}{" "}
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
						{isClosed ? tr("reopen") : tr("close")}
					</Button>
				</div>

				{owner.data ? (
					<Link
						to={`/user/${owner.data.profileUrl}` as never}
						className="flex items-center gap-3 border-b border-border p-4 hover:bg-muted/40"
					>
						<Avatar className="size-10 rounded-lg">
							<AvatarImage
								src={ownerAvatar.data?.url}
								alt={ownerName}
								className="rounded-lg"
							/>
							<AvatarFallback className="rounded-lg">
								{ownerName.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<div className="truncate text-sm font-medium">{ownerName}</div>
							<div className="truncate text-xs text-muted-foreground">
								@{owner.data.profileUrl}
							</div>
						</div>
						<span className="ml-auto text-xs text-muted-foreground">
							{tr("viewProfile")}
						</span>
					</Link>
				) : null}

				<div
					ref={scrollRef}
					className="max-h-[55vh] space-y-4 overflow-y-auto p-4"
				>
					{t.messages.map((m) => (
						<div
							key={m.id}
							className={cn(
								"flex flex-col gap-1.5",
								m.isStaff ? "items-end" : "items-start",
							)}
						>
							<div className="text-xs text-muted-foreground">
								{m.isStaff ? tr("staff") : ownerName} ·{" "}
								{fmt.dateTime(m.createdAt)}
							</div>
							{m.body ? (
								<div
									className={cn(
										"max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
										m.isStaff
											? "bg-primary text-primary-foreground"
											: "bg-muted text-foreground",
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
							<span>{tr("ticketClosed")}</span>
							<Button
								variant="outline"
								size="sm"
								disabled={setStatus.isPending}
								onClick={() => setStatus.mutate("open")}
							>
								{tr("reopen")}
							</Button>
						</div>
					) : (
						<div className="space-y-2">
							<Textarea
								value={reply}
								onChange={(e) => setReply(e.target.value)}
								placeholder={tr("replyAsStaff")}
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
									{send.isPending ? tr("sending") : tr("reply")}
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
