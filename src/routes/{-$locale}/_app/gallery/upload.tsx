import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import InputField from "@/components/fields/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/gallery/upload")({
	component: UploadPage,
});

const schema = z.object({
	name: z.string().min(1).max(200),
	longText: z.string().max(10000).optional(),
	nsfw: z.boolean().optional(),
});

function makeFileId(): string {
	return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

const MIME_LABELS: Record<string, string> = {
	"image/jpeg": "JPG",
	"image/png": "PNG",
	"image/webp": "WebP",
	"image/gif": "GIF",
	"video/mp4": "MP4",
	"video/webm": "WebM",
	"video/quicktime": "MOV",
};

function mimeLabel(mime: string): string {
	return MIME_LABELS[mime] ?? mime.split("/")[1]?.toUpperCase() ?? mime;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	const mb = bytes / (1024 * 1024);
	return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

function uploadToS3(
	url: string,
	file: File,
	onProgress: (pct: number) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url);
		xhr.setRequestHeader(
			"Content-Type",
			file.type || "application/octet-stream",
		);
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable)
				onProgress(Math.round((e.loaded / e.total) * 100));
		};
		xhr.onload = () =>
			xhr.status >= 200 && xhr.status < 300
				? resolve()
				: reject(new Error(`S3 upload failed: ${xhr.status}`));
		xhr.onerror = () => reject(new Error("S3 upload failed"));
		xhr.send(file);
	});
}

type Phase = "idle" | "init" | "upload" | "processing" | "save";

function UploadPage() {
	const t = useTranslations("galleryPages");
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [phase, setPhase] = useState<Phase>("idle");
	const [uploadPct, setUploadPct] = useState(0);

	const policy = useQuery(
		orpc.storage.policy.queryOptions({ input: undefined }),
	);
	const isVideo = file?.type.startsWith("video/") ?? false;

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	function pickFile(f: File | null) {
		if (f && policy.data) {
			if (!policy.data.allowedMime.includes(f.type)) {
				toast.error(t("typeNotAllowed", { type: f.type || t("thisFileType") }));
				return;
			}
			if (f.size > policy.data.maxBytes) {
				toast.error(
					t("fileTooLarge", { max: formatBytes(policy.data.maxBytes) }),
				);
				return;
			}
		}
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return f ? URL.createObjectURL(f) : null;
		});
		setFile(f);
	}

	function addTag(raw: string) {
		const t = raw.trim().replace(/,+$/, "").trim().slice(0, 40);
		if (t && !tags.includes(t) && tags.length < 20) setTags([...tags, t]);
		setTagInput("");
	}

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: { name: "", longText: "", nsfw: false },
	});

	const submit = useMutation({
		mutationFn: async (v: z.infer<typeof schema>) => {
			if (!file) throw new Error(t("pickFileFirst"));
			const fileId = makeFileId();

			setPhase("init");
			const { uploadUrl } = await client.storage.uploadInit({
				kind: "gallery",
				fileId,
				contentType: file.type || "application/octet-stream",
			});

			setPhase("upload");
			setUploadPct(0);
			await uploadToS3(uploadUrl, file, setUploadPct);

			setPhase("processing");
			await client.storage.finalize({ kind: "gallery", fileId });

			setPhase("save");
			const g = await client.gallery.create({
				name: v.name,
				longText: v.longText || undefined,
				nsfw: v.nsfw ?? false,
				tags,
				fileId,
				mimeType: file.type || undefined,
			});
			return g;
		},
		onSuccess: (g) => {
			toast.success(t("uploaded"));
			navigate({ to: `/gallery/${g.id}` as never });
		},
		onError: (e: Error) => {
			setPhase("idle");
			toast.error(e.message);
		},
	});

	const phaseLabel =
		phase === "init"
			? t("phasePreparing")
			: phase === "upload"
				? t("phaseUploading", { pct: uploadPct })
				: phase === "processing"
					? t("phaseProcessing")
					: phase === "save"
						? t("phaseSaving")
						: "";

	return (
		<main className="mx-auto max-w-2xl">
			<Card>
				<CardHeader>
					<CardTitle>{t("uploadTitle")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit((v) => submit.mutate(v))}
							className="space-y-4"
						>
							<div className="space-y-2">
								<p className="text-sm font-medium">{t("mediaFile")}</p>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input p-8 hover:border-primary hover:bg-primary/5 transition-colors"
								>
									{previewUrl ? (
										isVideo ? (
											<video
												src={previewUrl}
												className="max-h-48 rounded-lg"
												controls
												muted
											/>
										) : (
											<img
												src={previewUrl}
												alt={t("previewAlt")}
												className="max-h-48 rounded-lg object-contain"
											/>
										)
									) : (
										<span className="text-muted-foreground text-sm">
											{t("clickToChoose")}
										</span>
									)}
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept={policy.data?.allowedMime.join(",")}
									className="hidden"
									onChange={(e) => {
										pickFile(e.target.files?.[0] ?? null);
										e.target.value = "";
									}}
								/>
								{policy.data ? (
									<p className="text-xs text-muted-foreground">
										{t("allowedHint", {
											types: policy.data.allowedMime.map(mimeLabel).join(", "),
											max: formatBytes(policy.data.maxBytes),
										})}
									</p>
								) : null}
								{file ? (
									<p className="text-xs text-muted-foreground">
										{file.name} — {formatBytes(file.size)}
									</p>
								) : null}
							</div>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<InputField
										label={t("titleLabel")}
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="longText"
								render={({ field }) => (
									<InputField
										label={t("descriptionLabel")}
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<div className="space-y-2">
								<p className="text-sm font-medium">{t("tagsLabel")}</p>
								{tags.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{tags.map((tagName) => (
											<span
												key={tagName}
												className="inline-flex items-center gap-1 rounded-full bg-primary/15 py-1 pl-3 pr-1.5 text-sm text-primary"
											>
												{tagName}
												<button
													type="button"
													onClick={() =>
														setTags(tags.filter((x) => x !== tagName))
													}
													className="rounded-full p-0.5 hover:bg-primary/20"
													aria-label={t("removeTag", { tag: tagName })}
												>
													<X className="size-3.5" />
												</button>
											</span>
										))}
									</div>
								) : null}
								<Input
									value={tagInput}
									placeholder={t("tagInputPlaceholder")}
									disabled={tags.length >= 20}
									onChange={(e) => {
										if (e.target.value.includes(",")) addTag(e.target.value);
										else setTagInput(e.target.value);
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addTag(tagInput);
										} else if (
											e.key === "Backspace" &&
											!tagInput &&
											tags.length
										) {
											setTags(tags.slice(0, -1));
										}
									}}
								/>
							</div>
							<FormField
								control={form.control}
								name="nsfw"
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<Switch
											id="nsfw"
											checked={field.value ?? false}
											onCheckedChange={field.onChange}
										/>
										<Label
											htmlFor="nsfw"
											className="cursor-pointer select-none text-sm"
										>
											{t("markNsfw")}
										</Label>
									</div>
								)}
							/>
							{submit.isPending ? (
								<div className="space-y-1">
									<Progress
										value={
											phase === "upload"
												? uploadPct
												: phase === "init"
													? 0
													: 100
										}
									/>
									<p className="text-xs text-muted-foreground">{phaseLabel}</p>
								</div>
							) : null}
							<Button
								type="submit"
								disabled={submit.isPending || !file}
								className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
							>
								{submit.isPending ? t("uploading") : t("submit")}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</main>
	);
}
