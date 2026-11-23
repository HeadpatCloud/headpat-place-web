import { X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";

/** Same limits the API enforces on gallery tags. */
export const MAX_GALLERY_TAGS = 20;
const MAX_TAG_LENGTH = 40;

/** Tag chips with a text box: Enter or a comma adds, Backspace on an empty box removes the last. */
export function TagChipsInput({
	id,
	tags,
	onChange,
}: {
	id?: string;
	tags: string[];
	onChange: (tags: string[]) => void;
}) {
	const t = useTranslations("galleryPages");
	const [text, setText] = useState("");

	function addTag(raw: string) {
		const tag = raw.trim().replace(/,+$/, "").trim().slice(0, MAX_TAG_LENGTH);
		if (tag && !tags.includes(tag) && tags.length < MAX_GALLERY_TAGS)
			onChange([...tags, tag]);
		setText("");
	}

	return (
		<div className="space-y-2">
			{tags.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{tags.map((tagName) => (
						<span
							key={tagName}
							className="inline-flex items-center gap-1 rounded-full bg-primary/15 py-1 pl-3 pr-1.5 text-sm text-link"
						>
							{tagName}
							<button
								type="button"
								onClick={() => onChange(tags.filter((x) => x !== tagName))}
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
				id={id}
				value={text}
				placeholder={t("tagInputPlaceholder")}
				disabled={tags.length >= MAX_GALLERY_TAGS}
				onChange={(e) => {
					if (e.target.value.includes(",")) addTag(e.target.value);
					else setText(e.target.value);
				}}
				onBlur={() => {
					if (text.trim()) addTag(text);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						addTag(text);
					} else if (e.key === "Backspace" && !text && tags.length) {
						onChange(tags.slice(0, -1));
					}
				}}
			/>
		</div>
	);
}
