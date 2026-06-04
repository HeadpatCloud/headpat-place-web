import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TicketRow = {
	id: string;
	subject: string;
	category: string;
	priority: string;
	status: string;
	lastMessageAt: string | Date;
};

type Props = {
	tickets: TicketRow[];
	selectedId: string | null;
	onSelect: (id: string) => void;
};

export function TicketList({ tickets, selectedId, onSelect }: Props) {
	if (tickets.length === 0) {
		return (
			<p className="p-6 text-sm text-muted-foreground">No tickets here yet.</p>
		);
	}
	return (
		<ul className="divide-y divide-border">
			{tickets.map((t) => {
				const closed = t.status === "closed";
				return (
					<li key={t.id}>
						<button
							type="button"
							onClick={() => onSelect(t.id)}
							className={cn(
								"flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-muted/50",
								selectedId === t.id && "bg-muted",
							)}
						>
							<div className="flex items-center gap-2">
								<span className="min-w-0 flex-1 truncate text-sm font-medium">
									{t.subject}
								</span>
								<Badge
									className={cn(
										"shrink-0",
										closed
											? "bg-muted text-muted-foreground"
											: "bg-primary/15 text-primary hover:bg-primary/15",
									)}
								>
									{t.status}
								</Badge>
							</div>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<span className="rounded bg-muted px-1.5 py-0.5">
									{t.category}
								</span>
								<span className="rounded bg-muted px-1.5 py-0.5">
									{t.priority}
								</span>
								<span>
									·{" "}
									{formatDistanceToNow(new Date(t.lastMessageAt), {
										addSuffix: true,
									})}
								</span>
							</div>
						</button>
					</li>
				);
			})}
		</ul>
	);
}
