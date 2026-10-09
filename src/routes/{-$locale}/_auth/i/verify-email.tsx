import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ErrorMessage, SuccessMessage } from "@/components/alerts";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { z } from "@/lib/zod";

const searchSchema = z.object({
	token: z.string().optional(),
});

function emailFromToken(token: string | undefined): string | null {
	if (!token) return null;
	try {
		const payload = JSON.parse(
			atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
		);
		return typeof payload.email === "string" ? payload.email : null;
	} catch {
		return null;
	}
}

import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/{-$locale}/_auth/i/verify-email")({
	head: pageHead("authPages.checkInboxTitle", "/i/verify-email", {
		noindex: true,
	}),
	validateSearch: searchSchema,
	component: VerifyEmailPage,
});

function VerifyEmailPage() {
	const t = useTranslations("authPages");
	const { token } = useSearch({ from: "/{-$locale}/_auth/i/verify-email" });
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [email, setEmail] = useState(() => emailFromToken(token) ?? "");
	const [resending, setResending] = useState(false);
	const [resent, setResent] = useState(false);

	useEffect(() => {
		if (!token) {
			setError(t("missingVerificationToken"));
			setFailed(true);
			return;
		}
		let cancelled = false;
		(async () => {
			const r = await authClient.verifyEmail({ query: { token } });
			if (cancelled) return;
			if (r.error) {
				setError(r.error.message ?? t("verificationFailed"));
				setFailed(true);
				return;
			}
			setSuccess(t("emailVerifiedRedirecting"));
			setTimeout(() => navigate({ to: "/login" as never }), 1500);
		})();
		return () => {
			cancelled = true;
		};
	}, [token, navigate, t]);

	async function resend(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setResending(true);
		const r = await authClient.sendVerificationEmail({ email });
		setResending(false);
		if (r.error) {
			setError(r.error.message ?? t("somethingWentWrong"));
			return;
		}
		setResent(true);
	}

	return (
		<>
			{success && <SuccessMessage attentionSuccess={success} />}
			{error && !resent && <ErrorMessage attentionError={error} />}
			{resent && (
				<SuccessMessage attentionSuccess={t("verificationEmailSent")} />
			)}
			<div className="flex items-center justify-center px-6 py-12 lg:px-8">
				<div className="flex flex-col justify-center sm:mx-auto sm:w-full sm:max-w-sm">
					<BrandLogo
						size="lg"
						className="mx-auto h-24 w-auto"
						alt="Headpat Logo"
						width={128}
						height={128}
					/>
					<h4 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
						{failed ? t("verificationLinkInvalid") : t("verifyingEmail")}
					</h4>
					{failed && !resent ? (
						<form className="mt-10 space-y-6" onSubmit={resend}>
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium leading-6"
								>
									{t("emailAddressLabel")}
								</label>
								<div className="mt-2">
									<Input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
							</div>
							<Button type="submit" className="w-full" disabled={resending}>
								{resending ? t("sending") : t("resendVerification")}
							</Button>
						</form>
					) : null}
					{resent ? (
						<p className="mt-6 text-center text-sm text-gray-500">
							{t("verificationEmailSentHint")}
						</p>
					) : null}
				</div>
			</div>
		</>
	);
}
