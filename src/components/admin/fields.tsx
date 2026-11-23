import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** A labelled on/off row used by the admin edit forms. */
export function SwitchRow({
	id,
	label,
	checked,
	onChange,
}: {
	id: string;
	label: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
			<Label htmlFor={id}>{label}</Label>
			<Switch id={id} checked={checked} onCheckedChange={onChange} />
		</div>
	);
}

/** Date to the value a datetime-local input expects, in local time. */
export function toLocalInput(d: Date | string | null | undefined): string {
	if (!d) return "";
	const date = new Date(d);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Comma separated text to a clean tag list. */
export function parseTags(text: string): string[] {
	return [
		...new Set(
			text
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean),
		),
	];
}
