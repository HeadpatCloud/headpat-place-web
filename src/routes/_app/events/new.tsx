import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { EventForm } from "@/components/events/EventForm";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_app/events/new")({
	component: NewEventPage,
	head: () => ({ meta: [{ title: "New event" }] }),
});

function NewEventPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending && !session?.user) navigate({ to: "/login" as never });
	}, [session, isPending, navigate]);

	if (isPending) return <p className="p-4 text-muted-foreground">Loading…</p>;
	if (!session?.user) return null;

	return (
		<main className="mx-auto max-w-2xl space-y-6">
			<h2 className="text-2xl font-bold">Create event</h2>
			<EventForm mode="create" />
		</main>
	);
}
