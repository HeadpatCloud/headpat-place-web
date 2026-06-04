import { useQuery } from "@tanstack/react-query";
import { FileIcon } from "lucide-react";
import { orpc } from "@/lib/orpc";

function humanSize(bytes: number | null | undefined): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileName(key: string): string {
	return key.split("/").pop() ?? "file";
}

export function TicketAttachment({ attachmentKey }: { attachmentKey: string }) {
	const q = useQuery({
		...orpc.ticket.attachmentUrl.queryOptions({
			input: { key: attachmentKey },
		}),
		staleTime: 4 * 60 * 1000,
	});
	if (q.isPending) {
		return <div className="h-28 w-40 animate-pulse rounded-lg bg-muted" />;
	}
	if (!q.data) return null;
	const mime = q.data.mimeType ?? "";

	if (mime.startsWith("image/")) {
		return (
			<a href={q.data.url} target="_blank" rel="noreferrer" className="block">
				<img
					src={q.data.url}
					alt={fileName(attachmentKey)}
					className="max-h-72 max-w-xs rounded-lg border border-border object-contain"
					loading="lazy"
				/>
			</a>
		);
	}
	return (
		<a
			href={q.data.url}
			target="_blank"
			rel="noreferrer"
			download
			className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
		>
			<FileIcon className="size-4 shrink-0 text-muted-foreground" />
			<span className="truncate">{fileName(attachmentKey)}</span>
			<span className="shrink-0 text-xs text-muted-foreground">
				{humanSize(q.data.sizeBytes)}
			</span>
		</a>
	);
}
