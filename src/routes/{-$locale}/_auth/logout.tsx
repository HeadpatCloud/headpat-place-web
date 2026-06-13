import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";

export const Route = createFileRoute("/{-$locale}/_auth/logout")({
	component: LogoutPage,
});

function LogoutPage() {
	const t = useTranslations("authPages");
	useEffect(() => {
		(async () => {
			await signOut();
			window.location.href = "/";
		})();
	}, []);
	return (
		<div className="flex items-center justify-center px-6 py-12">
			<p className="text-muted-foreground">{t("loggingOut")}</p>
		</div>
	);
}
