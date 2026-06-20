import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";

// Better Auth redirects OAuth failures back to the web origin with ?error=<code>.
// The code is attacker-controllable via the URL, so never echo it verbatim.
export function useOAuthErrorToast() {
	const t = useTranslations("auth");

	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		const code = params.get("error");
		if (!code) return;

		const message =
			code === "email_doesn't_match"
				? t("errors.oauthEmailMismatch")
				: t("errors.oauthGeneric");
		toast.error(message);

		params.delete("error");
		const query = params.toString();
		const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
		window.history.replaceState(window.history.state, "", url);
	}, [t]);
}
