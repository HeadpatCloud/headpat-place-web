import type { ReactNode } from "react";

const MAX_STEP = 12;

export function FadeIn({
	index = 0,
	className = "",
	children,
}: {
	index?: number;
	className?: string;
	children: ReactNode;
}) {
	const step = Math.min(Math.max(Math.round(index), 0), MAX_STEP);
	return (
		<div className={`fade-in fade-in-${step} ${className}`.trim()}>
			{children}
		</div>
	);
}
