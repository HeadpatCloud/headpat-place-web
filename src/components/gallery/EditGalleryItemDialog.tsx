import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { TagChipsInput } from "@/components/gallery/TagChipsInput";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

type EditableItem = {
	id: string;
	name: string;
	longText: string | null;
	tags: string[];
	nsfw: boolean;
};

/** Owner-only editor for a gallery item's title, description, tags and 18+ flag. */
export function EditGalleryItemDialog({
	item,
	trigger,
}: {
	item: EditableItem;
	trigger: ReactNode;
}) {
	const t = useTranslations("galleryPages");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(item.name);
	const [longText, setLongText] = useState(item.longText ?? "");
	const [tags, setTags] = useState<string[]>(item.tags);
	const [nsfw, setNsfw] = useState(item.nsfw);

	function onOpenChange(next: boolean) {
		// Start from the saved values each time, so a cancelled edit leaves nothing behind.
		if (next) {
			setName(item.name);
			setLongText(item.longText ?? "");
			setTags(item.tags);
			setNsfw(item.nsfw);
		}
		setOpen(next);
	}

	const save = useMutation({
		mutationFn: () =>
			client.gallery.update({
				itemId: item.id,
				name: name.trim(),
				longText: longText.trim() || null,
				tags,
				nsfw,
			}),
		onSuccess: async () => {
			toast.success(t("saved"));
			setOpen(false);
			// Covers this item's byId plus every gallery list it shows up in.
			await qc.invalidateQueries({ queryKey: orpc.gallery.key() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function submit(e: FormEvent) {
		e.preventDefault();
		if (name.trim()) save.mutate();
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("editTitle")}</DialogTitle>
					<DialogDescription>{t("editDescription")}</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="gallery-edit-name">{t("titleLabel")}</Label>
						<Input
							id="gallery-edit-name"
							value={name}
							maxLength={200}
							required
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="gallery-edit-text">{t("descriptionLabel")}</Label>
						<Textarea
							id="gallery-edit-text"
							rows={4}
							maxLength={10000}
							value={longText}
							onChange={(e) => setLongText(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="gallery-edit-tags">{t("tagsLabel")}</Label>
						<TagChipsInput
							id="gallery-edit-tags"
							tags={tags}
							onChange={setTags}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Switch
							id="gallery-edit-nsfw"
							checked={nsfw}
							onCheckedChange={setNsfw}
						/>
						<Label
							htmlFor="gallery-edit-nsfw"
							className="cursor-pointer select-none text-sm"
						>
							{t("markNsfw")}
						</Label>
					</div>
					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{c("cancel")}
						</Button>
						<Button
							type="submit"
							disabled={save.isPending || !name.trim()}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{save.isPending ? t("saving") : c("save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
