import type { LucideIcon } from "lucide-react";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { cn } from "@/lib/utils";

type Props = {
	label: string;
	value: number | string | undefined;
	icon: LucideIcon;
	tint?: string;
	to?: string;
	alert?: boolean;
};

export function StatCard({ label, value, icon: Icon, tint, to, alert }: Props) {
	const body = (
		<>
			<span
				className={cn(
					"flex size-10 items-center justify-center rounded-2xl bg-card text-link",
					alert && "text-destructive",
				)}
			>
				<Icon className="size-5" />
			</span>
			<span className="font-display text-3xl font-semibold tabular-nums">
				{value === undefined ? "–" : value}
			</span>
			<span className="text-sm font-semibold text-muted-foreground">
				{label}
			</span>
		</>
	);
	const cls = cn(
		"flex flex-col gap-2 rounded-3xl p-5 transition-transform",
		tint ?? "bg-primary/10",
		to &&
			"hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
	);
	return to ? (
		<Link to={to} className={cls}>
			{body}
		</Link>
	) : (
		<div className={cls}>{body}</div>
	);
}
