import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TableCard({ children }: { children: ReactNode }) {
	// The zero-minimum grid track stops a wide table from stretching the page;
	// it scrolls inside its card instead.
	return (
		<div className="grid grid-cols-[minmax(0,1fr)]">
			<div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
				<table className="w-full text-left text-sm">{children}</table>
			</div>
		</div>
	);
}

export function Th({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return (
		<th
			scope="col"
			className={cn(
				"border-b border-border bg-muted/40 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-muted-foreground",
				className,
			)}
		>
			{children}
		</th>
	);
}

export function Td({
	children,
	className,
}: {
	children?: ReactNode;
	className?: string;
}) {
	return (
		<td className={cn("px-4 py-3 align-middle", className)}>{children}</td>
	);
}

export function Tr({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<tr
			className={cn(
				"border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
				className,
			)}
		>
			{children}
		</tr>
	);
}
