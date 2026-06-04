import { useQuery } from "@tanstack/react-query";
import { FileIcon } from "lucide-react";
import { orpc } from "@/lib/orpc";

function useAttachmentUrl(key: string, variant?: string) {
	return useQuery({
		...orpc.storage.attachmentUrl.queryOptions({ input: { key, variant } }),
		staleTime: 4 * 60 * 1000,
	});
}

function humanSize(bytes: number | null): string {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachment({
	attachmentKey,
}: {
	attachmentKey: string;
}) {
	const q = useAttachmentUrl(attachmentKey, "md");
	const mime = q.data?.mimeType ?? "";

	if (q.isPending) {
		return <div className="h-32 w-48 animate-pulse rounded-lg bg-muted" />;
	}
	if (!q.data) return null;

	if (mime.startsWith("image/")) {
		return (
			<a href={q.data.url} target="_blank" rel="noreferrer" className="block">
				{/* biome-ignore lint/a11y/useAltText: chat image attachment */}
				<img
					src={q.data.url}
					className="max-h-80 max-w-xs rounded-lg border border-border object-cover"
					loading="lazy"
				/>
			</a>
		);
	}
	if (mime.startsWith("video/")) {
		return (
			// biome-ignore lint/a11y/useMediaCaption: user-uploaded chat video has no caption track
			<video
				controls
				className="max-h-80 max-w-xs rounded-lg border border-border"
			>
				<source src={q.data.url} type={mime} />
			</video>
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
			<span className="truncate">{mime || "File"}</span>
			<span className="shrink-0 text-xs text-muted-foreground">
				{humanSize(q.data.sizeBytes)}
			</span>
		</a>
	);
}
