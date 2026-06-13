import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { EventForm } from "@/components/events/EventForm";
import { useSession } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/events/$eventId_/edit")({
	component: EditEventPage,
	head: () => ({ meta: [{ title: "Edit event" }] }),
});

function EditEventPage() {
	const { eventId } = Route.useParams();
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const event = useQuery(orpc.event.byId.queryOptions({ input: { eventId } }));

	useEffect(() => {
		if (!isPending && !session?.user) navigate({ to: "/login" as never });
	}, [session, isPending, navigate]);

	if (isPending || event.isPending)
		return <p className="p-4 text-muted-foreground">Loading…</p>;
	if (!session?.user) return null;
	if (event.isError || !event.data)
		return <p className="p-4">Event not found.</p>;
	const e = event.data;
	if (e.creatorUserId !== session.user.id)
		return <p className="p-4">You can only edit events you created.</p>;

	return (
		<main className="mx-auto max-w-2xl space-y-6">
			<h2 className="text-2xl font-bold">Edit event</h2>
			<EventForm mode="edit" initial={e} />
		</main>
	);
}
