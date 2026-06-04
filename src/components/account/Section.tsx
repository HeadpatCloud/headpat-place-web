import { type ReactNode, useId } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type SectionProps = {
	id: string;
	title: string;
	description?: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
};

export function Section({
	id,
	title,
	description,
	action,
	children,
	className,
}: SectionProps) {
	return (
		<section id={id} className={cn("scroll-mt-24", className)}>
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">{title}</h2>
					{description ? (
						<p className="mt-1 text-sm text-muted-foreground">{description}</p>
					) : null}
				</div>
				{action ? <div className="shrink-0">{action}</div> : null}
			</div>
			{children}
		</section>
	);
}

export function Panel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("rounded-xl border border-border bg-card", className)}>
			{children}
		</div>
	);
}

export function ToggleRow({
	title,
	description,
	checked,
	onChange,
	disabled,
}: {
	title: string;
	description: string;
	checked: boolean;
	onChange: (value: boolean) => void;
	disabled?: boolean;
}) {
	const id = useId();
	return (
		<label
			htmlFor={id}
			className={cn(
				"flex items-center justify-between gap-4 py-3.5",
				disabled && "opacity-50",
			)}
		>
			<span className="min-w-0">
				<span className="block text-sm font-medium">{title}</span>
				<span className="block text-xs text-muted-foreground">
					{description}
				</span>
			</span>
			<Switch
				id={id}
				checked={checked}
				onCheckedChange={onChange}
				disabled={disabled}
			/>
		</label>
	);
}
