import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ErrorMessage, SuccessMessage } from "@/components/alerts";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";

const searchSchema = z.object({
	token: z.string().optional(),
});

export const Route = createFileRoute("/{-$locale}/_auth/i/verify-email")({
	validateSearch: searchSchema,
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	const t = useTranslations("authPages");
	const { token } = useSearch({ from: "/{-$locale}/_auth/i/verify-email" });
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	useEffect(() => {
		if (!token) {
			setError(t("missingVerificationToken"));
			return;
		}
		let cancelled = false;
		(async () => {
			const r = await authClient.verifyEmail({ query: { token } });
			if (cancelled) return;
			if (r.error) {
				setError(r.error.message ?? t("verificationFailed"));
				return;
			}
			setSuccess(t("emailVerifiedRedirecting"));
			setTimeout(() => navigate({ to: "/account" as never }), 1500);
		})();
		return () => {
			cancelled = true;
		};
	}, [token, navigate, t]);

	return (
		<>
			{success && <SuccessMessage attentionSuccess={success} />}
			{error && <ErrorMessage attentionError={error} />}
			<div className="flex items-center justify-center px-6 py-12 lg:px-8">
				<div className="text-center">
					<h4 className="text-2xl font-bold leading-9 tracking-tight">
						{t("verifyingEmail")}
					</h4>
				</div>
			</div>
		</>
	);
}
