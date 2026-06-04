import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import type { StorageKind } from "@/components/StorageImage";
import { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

function makeFileId(): string {
	return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

type Props = {
	kind: Extract<StorageKind, "avatar" | "banner">;
	currentFileId?: string | null;
	onChange: (fileId: string | null) => unknown;
	children: ReactNode;
	className?: string;
	rounded?: string;
	label: string;
};

export function MediaEditOverlay({
	kind,
	currentFileId,
	onChange,
	children,
	className,
	rounded,
	label,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const qc = useQueryClient();
	const [busy, setBusy] = useState(false);
	const [drag, setDrag] = useState(false);

	async function onPick(file: File) {
		if (!file.type.startsWith("image/")) {
			toast.error("That doesn't look like an image.");
			return;
		}
		setBusy(true);
		try {
			const fileId = makeFileId();
			const { uploadUrl } = await client.storage.uploadInit({
				kind,
				fileId,
				contentType: file.type || "application/octet-stream",
			});
			const put = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type || "application/octet-stream" },
				body: file,
			});
			if (!put.ok) throw new Error(`Upload failed: ${put.status}`);
			await client.storage.finalize({ kind, fileId });
			await onChange(fileId);
			await qc.invalidateQueries({ queryKey: ["storage", "url"] });
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setBusy(false);
		}
	}

	async function remove() {
		setBusy(true);
		try {
			await onChange(null);
			await qc.invalidateQueries({ queryKey: ["storage", "url"] });
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setBusy(false);
		}
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop zone; the inner button is the keyboard-accessible control
		<div
			className={cn("group/media relative overflow-hidden", rounded, className)}
			onDragOver={(e) => {
				e.preventDefault();
				setDrag(true);
			}}
			onDragLeave={() => setDrag(false)}
			onDrop={(e) => {
				e.preventDefault();
				setDrag(false);
				const f = e.dataTransfer.files?.[0];
				if (f) onPick(f);
			}}
		>
			{children}
			<button
				type="button"
				aria-label={label}
				onClick={() => inputRef.current?.click()}
				className={cn(
					"absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/55 text-foreground opacity-0 backdrop-blur-[2px] transition-opacity group-hover/media:opacity-100 focus-visible:opacity-100 focus-visible:outline-none",
					(drag || busy) && "opacity-100",
				)}
			>
				{busy ? (
					<Loader2 className="size-5 animate-spin" />
				) : (
					<Camera className="size-5" />
				)}
				<span className="text-xs font-medium">
					{busy ? "Uploading…" : drag ? "Drop to upload" : label}
				</span>
			</button>
			{currentFileId && !busy ? (
				<button
					type="button"
					aria-label={`Remove ${kind}`}
					onClick={remove}
					className="absolute right-2 top-2 z-10 rounded-md bg-background/80 p-1.5 text-destructive opacity-0 transition-opacity hover:bg-background group-hover/media:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
				>
					<Trash2 className="size-4" />
				</button>
			) : null}
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) onPick(f);
					e.target.value = "";
				}}
			/>
		</div>
	);
}
