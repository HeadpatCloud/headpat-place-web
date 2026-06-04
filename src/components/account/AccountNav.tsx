import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { id: string; label: string; icon: LucideIcon };

type Props = {
	items: NavItem[];
	activeId: string;
	onSelect: (id: string) => void;
	variant: "rail" | "bar";
	className?: string;
};

export function AccountNav({
	items,
	activeId,
	onSelect,
	variant,
	className,
}: Props) {
	if (variant === "bar") {
		return (
			<nav
				className={cn(
					"flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1",
					className,
				)}
			>
				{items.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						type="button"
						onClick={() => onSelect(id)}
						className={cn(
							"flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
							activeId === id
								? "bg-primary/15 text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon className="size-4" />
						{label}
					</button>
				))}
			</nav>
		);
	}

	return (
		<nav className={cn("flex flex-col gap-1", className)}>
			{items.map(({ id, label, icon: Icon }) => (
				<button
					key={id}
					type="button"
					onClick={() => onSelect(id)}
					className={cn(
						"flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
						activeId === id
							? "bg-muted font-medium text-foreground"
							: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
					)}
				>
					<Icon className={cn("size-4", activeId === id && "text-primary")} />
					{label}
				</button>
			))}
		</nav>
	);
}
