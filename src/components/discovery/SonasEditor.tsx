import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { StorageImage } from "@/components/StorageImage";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";
import { uploadImage } from "@/lib/upload-image";

type Sona = {
	id: string;
	name: string;
	species: string | null;
	pronouns: string | null;
	description: string | null;
	avatarFileId: string | null;
	refSheetFileId: string | null;
	colors: string[];
};

type Draft = Omit<Sona, "id">;

const EMPTY: Draft = {
	name: "",
	species: null,
	pronouns: null,
	description: null,
	avatarFileId: null,
	refSheetFileId: null,
	colors: [],
};

export function ImagePick({
	kind,
	fileId,
	onChange,
	label,
	square,
}: {
	kind: "avatar" | "gallery";
	fileId: string | null;
	onChange: (fileId: string | null) => void;
	label: string;
	square?: boolean;
}) {
	const t = useTranslations("discovery");
	const ref = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState(false);
	return (
		<div className="space-y-1.5">
			<Label>{label}</Label>
			<div className="flex items-center gap-3">
				<div
					className={
						square
							? "size-16 shrink-0 overflow-hidden rounded-xl bg-muted"
							: "h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-muted"
					}
				>
					<StorageImage
						kind={kind}
						fileId={fileId}
						variant={kind === "avatar" ? "sm" : "320"}
						className="h-full w-full object-cover"
						fallback={null}
					/>
				</div>
				<input
					ref={ref}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={async (e) => {
						const f = e.target.files?.[0];
						e.target.value = "";
						if (!f) return;
						setBusy(true);
						try {
							onChange(await uploadImage(kind, f));
						} catch (err) {
							toast.error((err as Error).message);
						} finally {
							setBusy(false);
						}
					}}
				/>
				<Button
					type="button"
					variant="secondary"
					size="sm"
					disabled={busy}
					onClick={() => ref.current?.click()}
				>
					{busy ? t("uploading") : t("chooseImage")}
				</Button>
				{fileId ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onChange(null)}
					>
						{t("removeImage")}
					</Button>
				) : null}
			</div>
		</div>
	);
}

function SonaDialog({
	open,
	initial,
	onClose,
	onSave,
	maxColors,
}: {
	open: boolean;
	initial: Draft;
	onClose: () => void;
	onSave: (d: Draft) => Promise<void>;
	maxColors: number;
}) {
	const t = useTranslations("discovery");
	// pick the editable fields: the API rejects unknown keys like id
	const [d, setD] = useState<Draft>(() => ({
		name: initial.name,
		species: initial.species,
		pronouns: initial.pronouns,
		description: initial.description,
		avatarFileId: initial.avatarFileId,
		refSheetFileId: initial.refSheetFileId,
		colors: initial.colors,
	}));
	const [saving, setSaving] = useState(false);
	const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
		setD((cur) => ({ ...cur, [k]: v }));
	const text = (v: string) => (v.trim() ? v : null);

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{initial.name ? t("editSona") : t("addSona")}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="sona-name">{t("sonaName")}</Label>
						<Input
							id="sona-name"
							value={d.name}
							maxLength={80}
							onChange={(e) => set("name", e.target.value)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="sona-species">{t("sonaSpecies")}</Label>
							<Input
								id="sona-species"
								value={d.species ?? ""}
								maxLength={80}
								onChange={(e) => set("species", text(e.target.value))}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="sona-pronouns">{t("sonaPronouns")}</Label>
							<Input
								id="sona-pronouns"
								value={d.pronouns ?? ""}
								maxLength={40}
								onChange={(e) => set("pronouns", text(e.target.value))}
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="sona-desc">{t("sonaDescription")}</Label>
						<Textarea
							id="sona-desc"
							value={d.description ?? ""}
							maxLength={2000}
							rows={4}
							onChange={(e) => set("description", text(e.target.value))}
						/>
					</div>
					<ImagePick
						kind="avatar"
						square
						label={t("sonaPicture")}
						fileId={d.avatarFileId}
						onChange={(v) => set("avatarFileId", v)}
					/>
					<ImagePick
						kind="gallery"
						label={t("sonaRefSheet")}
						fileId={d.refSheetFileId}
						onChange={(v) => set("refSheetFileId", v)}
					/>
					<div className="space-y-1.5">
						<Label>{t("sonaColors")}</Label>
						<div className="flex flex-wrap items-center gap-2">
							{d.colors.map((c, i) => (
								<span
									key={`${c}-${i}`}
									className="inline-flex items-center gap-1 rounded-full border border-border p-1 pr-2"
								>
									<input
										type="color"
										value={c}
										aria-label={t("sonaColors")}
										className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
										onChange={(e) =>
											set(
												"colors",
												d.colors.map((x, j) => (j === i ? e.target.value : x)),
											)
										}
									/>
									<span className="font-mono text-xs">{c}</span>
									<button
										type="button"
										aria-label={t("removeColor")}
										onClick={() =>
											set(
												"colors",
												d.colors.filter((_, j) => j !== i),
											)
										}
									>
										<XIcon className="size-3.5" />
									</button>
								</span>
							))}
							{d.colors.length < maxColors ? (
								<Button
									type="button"
									variant="secondary"
									size="sm"
									onClick={() => set("colors", [...d.colors, "#7c3aed"])}
								>
									<PlusIcon className="size-4" />
									{t("addColor")}
								</Button>
							) : null}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="ghost" onClick={onClose}>
						{t("cancel")}
					</Button>
					<Button
						disabled={saving || !d.name.trim()}
						onClick={async () => {
							setSaving(true);
							try {
								await onSave({ ...d, name: d.name.trim() });
								onClose();
							} catch (e) {
								toast.error((e as Error).message);
							} finally {
								setSaving(false);
							}
						}}
					>
						{t("save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function SonasEditor() {
	const t = useTranslations("discovery");
	const qc = useQueryClient();
	const mine = useQuery(orpc.discovery.mine.queryOptions({ input: {} }));
	const options = useQuery(orpc.discovery.options.queryOptions());
	const sonas: Sona[] = mine.data?.sonas ?? [];
	const max = options.data?.maxSonas ?? 20;
	// null = closed, "new" = adding, otherwise the sona being edited
	const [editing, setEditing] = useState<Sona | "new" | null>(null);

	const refresh = () =>
		qc.invalidateQueries({ queryKey: orpc.discovery.key() });

	const move = async (index: number, by: -1 | 1) => {
		const ids = sonas.map((s) => s.id);
		const j = index + by;
		if (j < 0 || j >= ids.length) return;
		[ids[index], ids[j]] = [ids[j], ids[index]];
		await client.discovery.sonas.reorder({ ids });
		await refresh();
	};

	return (
		<div className="space-y-3">
			{sonas.length === 0 ? (
				<p className="text-sm text-muted-foreground">{t("noSonas")}</p>
			) : (
				<ul className="divide-y divide-border rounded-2xl border border-border">
					{sonas.map((s, i) => (
						<li key={s.id} className="flex items-center gap-3 p-3">
							<StorageImage
								kind="avatar"
								fileId={s.avatarFileId}
								variant="sm"
								className="size-12 shrink-0 rounded-xl object-cover"
								fallback={
									<div className="size-12 shrink-0 rounded-xl bg-muted" />
								}
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate font-semibold">{s.name}</p>
								<p className="truncate text-sm text-muted-foreground">
									{[s.species, s.pronouns].filter(Boolean).join(" · ")}
								</p>
							</div>
							<div className="flex gap-1">
								{s.colors.slice(0, 4).map((c) => (
									<span
										key={c}
										className="size-4 rounded-full border border-border"
										style={{ backgroundColor: c }}
									/>
								))}
							</div>
							<Button
								variant="ghost"
								size="icon"
								aria-label={t("moveUp")}
								disabled={i === 0}
								onClick={() => move(i, -1)}
							>
								<ArrowUpIcon className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								aria-label={t("moveDown")}
								disabled={i === sonas.length - 1}
								onClick={() => move(i, 1)}
							>
								<ArrowDownIcon className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								aria-label={t("editSona")}
								onClick={() => setEditing(s)}
							>
								<PencilIcon className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								aria-label={t("deleteSona")}
								onClick={async () => {
									if (!window.confirm(t("deleteSonaConfirm", { name: s.name })))
										return;
									await client.discovery.sonas.delete({ id: s.id });
									await refresh();
								}}
							>
								<Trash2Icon className="size-4" />
							</Button>
						</li>
					))}
				</ul>
			)}
			<Button
				variant="secondary"
				disabled={sonas.length >= max}
				onClick={() => setEditing("new")}
			>
				<PlusIcon className="size-4" />
				{t("addSona")}
			</Button>
			{editing ? (
				<SonaDialog
					key={editing === "new" ? "new" : editing.id}
					open
					initial={editing === "new" ? EMPTY : editing}
					maxColors={options.data?.maxSonaColors ?? 8}
					onClose={() => setEditing(null)}
					onSave={async (d) => {
						if (editing === "new") await client.discovery.sonas.create(d);
						else
							await client.discovery.sonas.update({ id: editing.id, sona: d });
						await refresh();
					}}
				/>
			) : null}
		</div>
	);
}
