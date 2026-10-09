import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminPage({
	title,
	description,
	actions,
	children,
}: {
	title: string;
	description?: string;
	actions?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h1 className="font-display text-3xl font-semibold tracking-tight">
						{title}
					</h1>
					{description ? (
						<p className="mt-1 text-muted-foreground">{description}</p>
					) : null}
				</div>
				{actions}
			</header>
			{children}
		</div>
	);
}

export function Panel({
	title,
	action,
	className,
	children,
}: {
	title?: string;
	action?: ReactNode;
	className?: string;
	children: ReactNode;
}) {
	return (
		<section
			className={cn(
				"rounded-3xl border border-border bg-card p-6 shadow-sm",
				className,
			)}
		>
			{title || action ? (
				<div className="mb-4 flex items-center justify-between gap-3">
					{title ? (
						<h2 className="font-display text-lg font-semibold">{title}</h2>
					) : (
						<span />
					)}
					{action}
				</div>
			) : null}
			{children}
		</section>
	);
}

export function Empty({ children }: { children: ReactNode }) {
	return (
		<p className="rounded-2xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
			{children}
		</p>
	);
}
