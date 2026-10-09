import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ErrorMessage, SuccessMessage } from "@/components/alerts";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";

const searchSchema = z.object({
	token: z.string().optional(),
});

export const Route = createFileRoute("/{-$locale}/_auth/i/reset-password")({
	validateSearch: searchSchema,
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const t = useTranslations("authPages");
	const { token } = useSearch({ from: "/{-$locale}/_auth/i/reset-password" });
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!token) {
			setError(t("missingResetToken"));
			setTimeout(() => setError(null), 5000);
			return;
		}
		if (password !== confirmPassword) {
			setError(t("passwordsDontMatch"));
			setTimeout(() => setError(null), 5000);
			return;
		}
		const r = await authClient.resetPassword({ newPassword: password, token });
		if (r.error) {
			setError(r.error.message ?? t("resetFailed"));
			setTimeout(() => setError(null), 5000);
			return;
		}
		setSuccess(t("passwordResetSuccess"));
	}

	return (
		<>
			{success && <SuccessMessage attentionSuccess={success} />}
			{error && <ErrorMessage attentionError={error} />}
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
						{t("resetPasswordTitle")}
					</h4>
					<form className="mt-10 space-y-6" onSubmit={handleSubmit}>
						<div>
							<Label htmlFor="newpassword">{t("newPasswordLabel")}</Label>
							<div className="mt-2">
								<Input
									id="newpassword"
									type="password"
									autoComplete="new-password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="confirmpassword">
								{t("confirmPasswordLabel")}
							</Label>
							<div className="mt-2">
								<Input
									id="confirmpassword"
									type="password"
									autoComplete="new-password"
									required
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<Button type="submit" className="w-full">
								{t("resetPasswordButton")}
							</Button>
						</div>
						<div>
							<Button variant="destructive" asChild className="w-full">
								<Link to={"/login" as never}>{t("backToLogin")} &rarr;</Link>
							</Button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
