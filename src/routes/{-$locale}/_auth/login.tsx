import { zodResolver } from "@hookform/resolvers/zod";
import {
	SiApple,
	SiDiscord,
	SiGithub,
	SiGoogle,
	SiTwitch,
} from "@icons-pack/react-simple-icons";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import CheckboxField from "@/components/fields/CheckboxField";
import InputField from "@/components/fields/InputField";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client";
import { humanizeError } from "@/lib/funny-errors";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { pageHead } from "@/lib/seo";
import { useOAuthErrorToast } from "@/lib/use-oauth-error";
import { z } from "@/lib/zod";
export const Route = createFileRoute("/{-$locale}/_auth/login")({
	head: pageHead("titles.login", "/login", { noindex: true }),
	validateSearch: (s: Record<string, unknown>) => ({
		ref: s.ref === "profile" ? ("profile" as const) : undefined,
	}),
	component: LoginPage,
});

type LoginFormData = { email: string; password: string };
type RegisterFormData = {
	username: string;
	email: string;
	password: string;
	acceptedTerms: boolean;
};

async function startOAuth(provider: string) {
	// Absolute URL on the web origin — the API and web are different origins, so a
	// relative callbackURL would resolve against the API (api.headpat.place).
	const callbackURL = `${window.location.origin}/account`;
	const errorCallbackURL = `${window.location.origin}/login`;
	if (provider === "eurofurence") {
		await authClient.signIn.oauth2({
			providerId: "eurofurence",
			callbackURL,
			errorCallbackURL,
		});
		return;
	}
	await signIn.social({
		provider: provider as Parameters<typeof signIn.social>[0]["provider"],
		callbackURL,
		errorCallbackURL,
	});
}

function LoginPage() {
	const t = useTranslations("authPages");
	const navigate = useNavigate();
	const { ref } = Route.useSearch();
	useOAuthErrorToast();
	const { data: session } = useSession();
	const [isRegistering, setIsRegistering] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);
	const [shakeKey, setShakeKey] = useState(0);
	const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
	const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
	const cardRef = useRef<HTMLDivElement>(null);

	const loginSchema = useMemo(
		() =>
			z.object({
				email: z.string().email(t("invalidEmail")).trim(),
				password: z
					.string()
					.trim()
					.min(8, t("passwordTooShort"))
					.max(256, t("passwordTooLong")),
			}),
		[t],
	);
	const registerSchema = useMemo(
		() =>
			z.object({
				username: z.string().trim().min(3, t("displayNameTooShort")),
				email: z.string().email(t("invalidEmail")).trim(),
				password: z
					.string()
					.trim()
					.min(8, t("passwordTooShort"))
					.max(256, t("passwordTooLong")),
				acceptedTerms: z.boolean().refine((v) => v === true, {
					message: t("mustAcceptTerms"),
				}),
			}),
		[t],
	);

	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: "onTouched",
		defaultValues: { email: "", password: "" },
	});
	const registerForm = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		mode: "onTouched",
		defaultValues: {
			username: "",
			email: "",
			password: "",
			acceptedTerms: false,
		},
	});

	useEffect(() => {
		if (session?.user) navigate({ to: "/account" as never });
	}, [session, navigate]);

	useEffect(() => {
		if (shakeKey === 0) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		cardRef.current?.animate(
			[
				{ transform: "translateX(0)" },
				{ transform: "translateX(-9px)" },
				{ transform: "translateX(8px)" },
				{ transform: "translateX(-5px)" },
				{ transform: "translateX(3px)" },
				{ transform: "translateX(0)" },
			],
			{ duration: 420, easing: "ease-in-out" },
		);
	}, [shakeKey]);

	function fail(message: string) {
		setAuthError(message);
		setShakeKey((k) => k + 1);
	}

	async function submitLogin(data: LoginFormData) {
		setAuthError(null);
		setUnverifiedEmail(null);
		try {
			const r = await signIn.email({
				email: data.email,
				password: data.password,
			});
			if (r.error) {
				if (
					r.error.code === "TWO_FACTOR_REQUIRED" ||
					r.error.message?.toLowerCase().includes("factor")
				) {
					navigate({ to: "/login/mfa" as never });
					return;
				}
				if (r.error.code === "EMAIL_NOT_VERIFIED") {
					setUnverifiedEmail(data.email);
					fail(t("emailNotVerifiedHint"));
					return;
				}
				fail(humanizeError(r.error.message ?? t("wrongEmailOrPassword")));
				return;
			}
			toast.success(t("loggedInSuccess"));
			navigate({ to: "/account" as never });
		} catch (e) {
			fail(humanizeError(e instanceof Error ? e.message : null));
		}
	}

	async function resendVerification() {
		if (!unverifiedEmail) return;
		const r = await authClient.sendVerificationEmail({
			email: unverifiedEmail,
		});
		if (r.error) {
			toast.error(r.error.message ?? t("somethingWentWrong"));
			return;
		}
		toast.success(t("verificationEmailSent"));
	}

	async function submitRegister(data: RegisterFormData) {
		setAuthError(null);
		try {
			const r = await signUp.email({
				email: data.email,
				password: data.password,
				name: data.username,
			});
			if (r.error) {
				fail(humanizeError(r.error.message ?? t("couldNotCreateAccount")));
				return;
			}
			setRegisteredEmail(data.email);
		} catch (e) {
			fail(humanizeError(e instanceof Error ? e.message : null));
		}
	}

	return (
		<div className="flex items-center justify-center">
			<div
				ref={cardRef}
				className="w-full rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
			>
				<div className="text-center">
					<div className="flex items-center justify-center gap-2.5">
						<BrandLogo
							size="sm"
							alt=""
							width={40}
							height={40}
							className="size-10"
						/>
						<span className="font-display text-2xl font-semibold tracking-tight">
							headpat
						</span>
					</div>
					<h4 className="mt-6 font-display text-3xl font-semibold leading-tight">
						{ref === "profile" ? t("profileRefTitle") : t("welcomeTitle")}
					</h4>
					{ref === "profile" ? (
						<p className="mt-2 text-sm font-semibold leading-6 text-foreground/80">
							{t("profileRefSubtitle")}
						</p>
					) : null}
					<p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
						{isRegistering ? t("alreadyRegistered") : t("notYetRegistered")}{" "}
						<button
							type="button"
							onClick={() => {
								setIsRegistering(!isRegistering);
								setAuthError(null);
							}}
							className="text-link hover:text-link/80 font-semibold"
						>
							{t("clickHere")}
						</button>
					</p>
				</div>

				{authError ? (
					<div
						role="alert"
						aria-live="assertive"
						className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
					>
						<span aria-hidden="true">😿</span>
						<span>{authError}</span>
					</div>
				) : null}
				{unverifiedEmail ? (
					<div className="mt-2 text-center">
						<Button
							variant="link"
							type="button"
							className="text-link"
							onClick={resendVerification}
						>
							{t("resendVerification")}
						</Button>
					</div>
				) : null}

				{registeredEmail ? (
					<div className="space-y-4 py-6 text-center">
						<h5 className="text-lg font-semibold">{t("checkInboxTitle")}</h5>
						<p className="text-sm text-muted-foreground">
							{t("checkInboxBody")}
						</p>
						<Button
							type="button"
							className="h-11 w-full rounded-full text-base font-extrabold"
							onClick={() => {
								setRegisteredEmail(null);
								setIsRegistering(false);
							}}
						>
							{t("backToSignIn")}
						</Button>
					</div>
				) : (
					<div className="mt-4">
						{isRegistering ? (
							<Form key="register" {...registerForm}>
								<form
									className="space-y-6"
									onSubmit={registerForm.handleSubmit(submitRegister)}
								>
									<div className="space-y-6 py-4">
										<div className="space-y-4">
											<FormField
												control={registerForm.control}
												name="username"
												render={({ field }) => (
													<InputField
														label={t("displayNameLabel")}
														description=""
														placeholder=""
														inputClassName="h-11 rounded-2xl bg-background"
														field={field}
													/>
												)}
											/>
											<FormField
												control={registerForm.control}
												name="email"
												render={({ field }) => (
													<InputField
														label={t("emailLabel")}
														description=""
														placeholder=""
														inputClassName="h-11 rounded-2xl bg-background"
														field={field}
													/>
												)}
											/>
											<FormField
												control={registerForm.control}
												name="password"
												render={({ field }) => (
													<InputField
														label={t("passwordLabel")}
														description=""
														placeholder=""
														inputClassName="h-11 rounded-2xl bg-background"
														field={field}
														type="password"
													/>
												)}
											/>
											<FormField
												control={registerForm.control}
												name="acceptedTerms"
												render={({ field }) => (
													<CheckboxField
														label={t("acceptTermsLabel")}
														description=""
														field={field}
													/>
												)}
											/>
											<Button className="h-11 w-full rounded-full bg-primary text-base font-extrabold text-primary-foreground hover:bg-primary/90">
												{t("registerButton")}
											</Button>
											<Link to={"/forgot-password" as never}>
												<Button
													variant="link"
													type="button"
													className="p-0 text-link"
												>
													{t("forgotPasswordLink")}
												</Button>
											</Link>
										</div>
									</div>
								</form>
							</Form>
						) : (
							<Form key="login" {...loginForm}>
								<form
									className="space-y-6"
									onSubmit={loginForm.handleSubmit(submitLogin)}
								>
									<div className="space-y-6 py-4">
										<div className="space-y-4">
											<FormField
												control={loginForm.control}
												name="email"
												render={({ field }) => (
													<InputField
														label={t("emailLabel")}
														description=""
														placeholder=""
														inputClassName="h-11 rounded-2xl bg-background"
														field={field}
													/>
												)}
											/>
											<FormField
												control={loginForm.control}
												name="password"
												render={({ field }) => (
													<InputField
														label={t("passwordLabel")}
														description=""
														placeholder=""
														inputClassName="h-11 rounded-2xl bg-background"
														field={field}
														type="password"
													/>
												)}
											/>
											<Button className="h-11 w-full rounded-full bg-primary text-base font-extrabold text-primary-foreground hover:bg-primary/90">
												{t("loginButton")}
											</Button>
											<Link to={"/forgot-password" as never}>
												<Button
													variant="link"
													type="button"
													className="p-0 text-link"
												>
													{t("forgotPasswordLink")}
												</Button>
											</Link>
										</div>
									</div>
								</form>
							</Form>
						)}

						<div className="mt-8">
							<div className="relative">
								<div
									className="absolute inset-0 flex items-center"
									aria-hidden="true"
								>
									<div className="w-full border-t border-border" />
								</div>
								<div className="relative flex justify-center text-sm font-medium leading-6">
									<span className="rounded-full bg-card px-4 text-muted-foreground">
										{t("orContinueWith")}
									</span>
								</div>
							</div>

							<div className="mt-6 grid grid-cols-2 gap-4">
								<button
									onClick={() => startOAuth("discord")}
									className="flex w-full items-center justify-center gap-3 h-11 rounded-full border border-black/20 bg-[#5865F2] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0] dark:border-white/20"
									type="button"
								>
									<SiDiscord className="h-5" />
									<span className="text-sm font-semibold leading-6">
										Discord
									</span>
								</button>

								<button
									onClick={() => startOAuth("eurofurence")}
									className="flex w-full items-center justify-center gap-3 h-11 rounded-full border border-black/20 bg-[#005953] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0] dark:border-white/20"
									type="button"
								>
									<img
										src="/logos/eurofurence.webp"
										alt="Eurofurence"
										className="rounded-xl"
										width={20}
										height={20}
									/>
									<span className="text-sm font-semibold leading-6">
										Eurofurence
									</span>
								</button>

								<button
									onClick={() => startOAuth("github")}
									className="flex w-full items-center justify-center gap-3 h-11 rounded-full border border-black/20 bg-[#24292F] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
									type="button"
								>
									<SiGithub className="h-5" />
									<span className="text-sm font-semibold leading-6">
										GitHub
									</span>
								</button>

								<button
									onClick={() => startOAuth("apple")}
									className="flex w-full items-center justify-center gap-3 h-11 rounded-full border border-black/20 bg-[#000000] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
									type="button"
								>
									<SiApple className="h-5" />
									<span className="text-sm font-semibold leading-6">Apple</span>
								</button>

								<button
									onClick={() => startOAuth("google")}
									className="flex w-full items-center justify-center gap-3 h-11 rounded-full border border-black/20 bg-[#131314] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
									type="button"
								>
									<SiGoogle className="h-4" />
									<span className="text-sm font-semibold leading-6">
										Google
									</span>
								</button>

								<button
									onClick={() => startOAuth("twitch")}
									className="flex w-full items-center justify-center gap-3 h-11 rounded-full border border-black/20 bg-[#6441A5] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
									type="button"
								>
									<SiTwitch className="h-5" />
									<span className="text-sm font-semibold leading-6">
										Twitch
									</span>
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
