import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBox({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) {
	return (
		<label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-border bg-card px-4 shadow-sm sm:max-w-md">
			<SearchIcon
				className="size-4 shrink-0 text-muted-foreground"
				aria-hidden
			/>
			<input
				type="search"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
			/>
		</label>
	);
}

export function Chips<T extends string>({
	value,
	options,
	onChange,
}: {
	value: T;
	options: { value: T; label: string }[];
	onChange: (v: T) => void;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{options.map((o) => (
				<button
					key={o.value}
					type="button"
					aria-pressed={value === o.value}
					onClick={() => onChange(o.value)}
					className={cn(
						"rounded-full px-4 py-2 text-sm font-extrabold transition-colors",
						value === o.value
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:text-foreground",
					)}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}
