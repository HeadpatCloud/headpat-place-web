import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LifeBuoy, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { NewTicketForm } from "@/components/tickets/NewTicketForm";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketThread } from "@/components/tickets/TicketThread";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/account/tickets")({
	validateSearch: (s: Record<string, unknown>) =>
		s.new === "1" || s.new === true ? { new: true as const } : {},
	component: TicketsPage,
});

const FILTERS = ["all", "open", "closed"] as const;

function TicketsPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const search = Route.useSearch();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [newOpen, setNewOpen] = useState(!!search.new);
	const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

	useEffect(() => {
		if (!isPending && !session?.user) navigate({ to: "/login" as never });
	}, [session, isPending, navigate]);

	const tickets = useQuery({
		...orpc.ticket.myList.queryOptions({ input: undefined }),
		enabled: !!session?.user,
	});

	if (isPending) {
		return <p className="p-4 text-muted-foreground">Loading…</p>;
	}
	if (!session?.user) return null;

	const list = (tickets.data ?? []).filter(
		(t) => filter === "all" || t.status === filter,
	);
	const detailOpen = newOpen || selectedId !== null;

	function openNew() {
		setNewOpen(true);
		setSelectedId(null);
	}
	function back() {
		setNewOpen(false);
		setSelectedId(null);
	}

	return (
		<div className="space-y-4 lg:h-[calc(100dvh-7rem)]">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-extrabold tracking-tight">
						Your tickets
					</h1>
					<p className="text-sm text-muted-foreground">
						Your conversations with support.{" "}
						<Link
							to={"/support" as never}
							className="text-link hover:underline"
						>
							Other ways to get help →
						</Link>
					</p>
				</div>
				<Button onClick={openNew} className="shrink-0">
					<Plus className="size-4" /> New ticket
				</Button>
			</div>

			<div className="grid gap-4 lg:h-[calc(100%-4rem)] lg:grid-cols-[340px_minmax(0,1fr)]">
				<aside
					className={cn(
						"flex flex-col overflow-hidden rounded-xl border border-border bg-card",
						detailOpen && "hidden lg:flex",
					)}
				>
					<div className="flex gap-1 border-b border-border p-2">
						{FILTERS.map((f) => (
							<button
								key={f}
								type="button"
								onClick={() => setFilter(f)}
								className={cn(
									"flex-1 rounded-md px-2 py-1.5 text-sm font-medium capitalize transition-colors",
									filter === f
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{f}
							</button>
						))}
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto">
						{tickets.isPending ? (
							<p className="p-6 text-sm text-muted-foreground">Loading…</p>
						) : (
							<TicketList
								tickets={list}
								selectedId={selectedId}
								onSelect={(id) => {
									setSelectedId(id);
									setNewOpen(false);
								}}
							/>
						)}
					</div>
				</aside>

				<section
					className={cn(
						"h-[calc(100dvh-9rem)] overflow-hidden rounded-xl border border-border bg-card lg:h-full",
						!detailOpen && "hidden lg:block",
					)}
				>
					{detailOpen ? (
						<button
							type="button"
							onClick={back}
							className="flex items-center gap-1.5 border-b border-border p-3 text-sm text-muted-foreground hover:text-foreground lg:hidden"
						>
							<ArrowLeft className="size-4" /> Back
						</button>
					) : null}
					{newOpen ? (
						<div className="p-5">
							<h2 className="mb-4 text-lg font-semibold">Open a ticket</h2>
							<NewTicketForm
								onCreated={(id) => {
									setNewOpen(false);
									setSelectedId(id);
								}}
								onCancel={() => setNewOpen(false)}
							/>
						</div>
					) : selectedId ? (
						<TicketThread ticketId={selectedId} />
					) : (
						<div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
							<LifeBuoy className="size-10 opacity-40" />
							<p>Select a ticket to read it, or open a new one.</p>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
