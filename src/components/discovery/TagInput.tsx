import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc";
import { useDebounced } from "@/lib/use-debounced";

type Props = {
	value: string[];
	onChange: (tags: string[]) => void;
	kind: "interest" | "into";
	max: number;
	placeholder: string;
	label: string;
};

function clean(tag: string): string {
	return tag.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 32);
}

// Free tags with suggestions from what other people already use, so spelling
// converges ("vrchat", not "vr chat" and "VRC") without a fixed list.
export function TagInput({
	value,
	onChange,
	kind,
	max,
	placeholder,
	label,
}: Props) {
	const [draft, setDraft] = useState("");
	const prefix = useDebounced(clean(draft), 200);
	const suggestions = useQuery({
		...orpc.discovery.suggestTags.queryOptions({ input: { kind, prefix } }),
		enabled: prefix.length > 0,
		staleTime: 60_000,
	});
	const full = value.length >= max;

	const add = (raw: string) => {
		const tag = clean(raw);
		setDraft("");
		if (!tag || value.includes(tag) || full) return;
		onChange([...value, tag]);
	};

	const options = (suggestions.data ?? []).filter((s) => !value.includes(s));

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-1.5">
				{value.map((tag) => (
					<span
						key={tag}
						className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-sm text-link"
					>
						{tag}
						<button
							type="button"
							className="rounded-full opacity-70 hover:opacity-100"
							onClick={() => onChange(value.filter((v) => v !== tag))}
							aria-label={`${label}: ${tag}`}
						>
							<XIcon className="size-3.5" />
						</button>
					</span>
				))}
			</div>
			<Input
				value={draft}
				disabled={full}
				placeholder={placeholder}
				aria-label={label}
				maxLength={32}
				onChange={(e) => {
					const v = e.target.value;
					if (v.endsWith(",")) add(v.slice(0, -1));
					else setDraft(v);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						add(draft);
					} else if (e.key === "Backspace" && !draft && value.length) {
						onChange(value.slice(0, -1));
					}
				}}
				onBlur={() => draft && add(draft)}
			/>
			{options.length > 0 && draft ? (
				<div className="flex flex-wrap gap-1.5">
					{options.map((s) => (
						<button
							key={s}
							type="button"
							// mousedown so it runs before the input's blur adds the draft
							onMouseDown={(e) => {
								e.preventDefault();
								add(s);
							}}
							className="rounded-full border border-border px-2.5 py-1 text-sm text-muted-foreground hover:bg-muted"
						>
							+ {s}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
