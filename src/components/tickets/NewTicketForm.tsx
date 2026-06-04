import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { client, orpc } from "@/lib/orpc";
import { uploadTicketAttachment } from "@/lib/ticket-attachments";
import { TicketAttachInput } from "./TicketAttachInput";

const CATEGORIES = [
	"general",
	"account",
	"technical",
	"report",
	"other",
] as const;
const PRIORITIES = ["low", "normal", "high"] as const;

type Props = {
	onCreated: (ticketId: string) => void;
	onCancel: () => void;
};

export function NewTicketForm({ onCreated, onCancel }: Props) {
	const qc = useQueryClient();
	const [subject, setSubject] = useState("");
	const [category, setCategory] =
		useState<(typeof CATEGORIES)[number]>("general");
	const [priority, setPriority] =
		useState<(typeof PRIORITIES)[number]>("normal");
	const [body, setBody] = useState("");
	const [files, setFiles] = useState<File[]>([]);

	const create = useMutation({
		mutationFn: async () => {
			const ticket = await client.ticket.create({
				subject: subject.trim(),
				body: body.trim(),
				category,
				priority,
			});
			if (files.length > 0) {
				const keys: string[] = [];
				for (const f of files) {
					try {
						keys.push((await uploadTicketAttachment(ticket.id, f)).key);
					} catch {
						toast.error(`Couldn't upload ${f.name}.`);
					}
				}
				if (keys.length > 0) {
					await client.ticket.setMessageAttachments({
						ticketId: ticket.id,
						messageId: ticket.firstMessageId,
						attachments: keys,
					});
				}
			}
			return ticket;
		},
		onSuccess: (t) => {
			qc.invalidateQueries({
				queryKey: orpc.ticket.myList.queryKey({ input: undefined }),
			});
			onCreated(t.id);
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function submit() {
		if (!subject.trim()) return toast.error("Add a subject first.");
		if (!body.trim()) return toast.error("Describe your issue first.");
		create.mutate();
	}

	return (
		<div className="space-y-4">
			<div className="space-y-1.5">
				<Label htmlFor="nt-subject">Subject</Label>
				<Input
					id="nt-subject"
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					placeholder="What do you need help with?"
					maxLength={200}
				/>
			</div>
			<div className="flex flex-col gap-3 sm:flex-row">
				<div className="flex-1 space-y-1.5">
					<Label>Category</Label>
					<Select
						value={category}
						onValueChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CATEGORIES.map((c) => (
								<SelectItem key={c} value={c}>
									{c}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex-1 space-y-1.5">
					<Label>Priority</Label>
					<Select
						value={priority}
						onValueChange={(v) => setPriority(v as (typeof PRIORITIES)[number])}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PRIORITIES.map((p) => (
								<SelectItem key={p} value={p}>
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="nt-body">Message</Label>
				<Textarea
					id="nt-body"
					value={body}
					onChange={(e) => setBody(e.target.value)}
					placeholder="Describe your issue in detail."
					className="min-h-[140px]"
					maxLength={10000}
				/>
			</div>
			<TicketAttachInput
				files={files}
				onChange={setFiles}
				disabled={create.isPending}
			/>
			<div className="flex gap-2">
				<Button disabled={create.isPending} onClick={submit}>
					{create.isPending ? "Submitting…" : "Submit ticket"}
				</Button>
				<Button variant="ghost" disabled={create.isPending} onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</div>
	);
}
