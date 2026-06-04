import { Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	isAllowedTicketFile,
	MAX_TICKET_ATTACHMENTS,
	TICKET_ATTACH_ACCEPT,
} from "@/lib/ticket-attachments";

type Props = {
	files: File[];
	onChange: (files: File[]) => void;
	disabled?: boolean;
};

export function TicketAttachInput({ files, onChange, disabled }: Props) {
	const ref = useRef<HTMLInputElement>(null);

	function add(list: FileList | null) {
		if (!list) return;
		const incoming = Array.from(list);
		const allowed = incoming.filter(isAllowedTicketFile);
		if (allowed.length < incoming.length) {
			toast.error(
				"Skipped some files — only images, PDF and text are allowed.",
			);
		}
		let next = [...files, ...allowed];
		if (next.length > MAX_TICKET_ATTACHMENTS) {
			toast.error(`Up to ${MAX_TICKET_ATTACHMENTS} files per message.`);
			next = next.slice(0, MAX_TICKET_ATTACHMENTS);
		}
		onChange(next);
	}

	return (
		<div className="space-y-2">
			<input
				ref={ref}
				type="file"
				accept={TICKET_ATTACH_ACCEPT}
				multiple
				className="hidden"
				onChange={(e) => {
					add(e.target.files);
					e.target.value = "";
				}}
			/>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={disabled || files.length >= MAX_TICKET_ATTACHMENTS}
				onClick={() => ref.current?.click()}
			>
				<Paperclip className="size-4" /> Attach files
			</Button>
			{files.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{files.map((f, i) => (
						<span
							key={`${f.name}-${i}`}
							className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs"
						>
							<span className="max-w-[160px] truncate">{f.name}</span>
							<button
								type="button"
								aria-label={`Remove ${f.name}`}
								disabled={disabled}
								onClick={() => onChange(files.filter((_, j) => j !== i))}
								className="text-muted-foreground hover:text-foreground"
							>
								<X className="size-3.5" />
							</button>
						</span>
					))}
				</div>
			) : null}
		</div>
	);
}
