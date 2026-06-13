import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { EventForm } from "@/components/events/EventForm";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";

export const Route = createFileRoute("/{-$locale}/_app/events/new")({
	component: NewEventPage,
	head: () => ({ meta: [{ title: "New event" }] }),
});

function NewEventPage() {
	const t = useTranslations("eventsPages");
	const c = useTranslations("common");
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending && !session?.user) navigate({ to: "/login" as never });
	}, [session, isPending, navigate]);

	if (isPending)
		return <p className="p-4 text-muted-foreground">{c("loading")}</p>;
	if (!session?.user) return null;

	return (
		<main className="mx-auto max-w-2xl space-y-6">
			<h2 className="text-2xl font-bold">{t("createEvent")}</h2>
			<EventForm mode="create" />
		</main>
	);
}
