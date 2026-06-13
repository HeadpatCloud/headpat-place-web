import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "@/lib/i18n";

export const Route = createFileRoute("/{-$locale}/chat/")({
	component: ChatIndex,
});

function ChatIndex() {
	const t = useTranslations("chatUi");
	return (
		<div className="flex h-svh items-center justify-center px-6 text-center">
			<p className="text-muted-foreground">{t("emptyStatePrompt")}</p>
		</div>
	);
}
