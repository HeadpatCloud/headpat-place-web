import { zodResolver } from "@hookform/resolvers/zod";
import {
	SiApple,
	SiDiscord,
	SiGithub,
	SiGoogle,
	SiTwitch,
} from "@icons-pack/react-simple-icons";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import CheckboxField from "@/components/fields/CheckboxField";
import InputField from "@/components/fields/InputField";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client";
import { humanizeError } from "@/lib/funny-errors";
import { useTranslations } from "@/lib/i18n";

export const Route = createFileRoute("/{-$locale}/_auth/login")({
	component: LoginPage,
});

type LoginFormData = { email: string; password: string };
type RegisterFormData = {
	username: string;
	email: string;
	password: string;
	acceptedTerms: boolean;
};

const loginSchema = z.object({
	email: z.string().email("Invalid email").trim(),
	password: z
		.string()
		.trim()
		.min(8, "Password must be at least 8 characters")
		.max(256, "Password must be at most 256 characters"),
});

const registerSchema = z.object({
	username: z
		.string()
		.trim()
		.min(3, "Display name must be at least 3 characters"),
	email: z.string().email("Invalid email").trim(),
	password: z
		.string()
		.trim()
		.min(8, "Password must be at least 8 characters")
		.max(256, "Password must be at most 256 characters"),
	acceptedTerms: z.boolean().refine((v) => v === true, {
		message: "You must accept the terms",
	}),
});

async function startOAuth(provider: string) {
	// Absolute URL on the web origin — the API and web are different origins, so a
	// relative callbackURL would resolve against the API (api.headpat.place).
	const callbackURL = `${window.location.origin}/account`;
	if (provider === "eurofurence") {
		await authClient.signIn.oauth2({
			providerId: "eurofurence",
			callbackURL,
		});
		return;
	}
	await signIn.social({
		provider: provider as Parameters<typeof signIn.social>[0]["provider"],
		callbackURL,
	});
}

function LoginPage() {
	const t = useTranslations("authPages");
	const navigate = useNavigate();
	const { data: session } = useSession();
	const [isRegistering, setIsRegistering] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);
	const [shakeKey, setShakeKey] = useState(0);
	const cardRef = useRef<HTMLDivElement>(null);

	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});
	const registerForm = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
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

	// Wiggle the card on a failed attempt — visible, immediate feedback.
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
				fail(humanizeError(r.error.message ?? t("wrongEmailOrPassword")));
				return;
			}
			toast.success(t("loggedInSuccess"));
			navigate({ to: "/account" as never });
		} catch (e) {
			fail(humanizeError(e instanceof Error ? e.message : null));
		}
	}

	async function submitRegister(data: RegisterFormData) {
		setAuthError(null);
		try {
			const r = await signUp.email({
				email: data.email,
				password: data.password,
				name: data.username,
				callbackURL: `${window.location.origin}/account`,
			});
			if (r.error) {
				fail(humanizeError(r.error.message ?? t("couldNotCreateAccount")));
				return;
			}
			toast.success(t("loggedInSuccess"));
			navigate({ to: "/account" as never });
		} catch (e) {
			fail(humanizeError(e instanceof Error ? e.message : null));
		}
	}

	return (
		<div className="flex items-center justify-center">
			<div
				ref={cardRef}
				className="min-w-1/3 mx-auto rounded-2xl dark:ring-white"
			>
				<div className="text-center">
					<h4 className="mt-8 text-2xl font-bold leading-9 tracking-tight">
						{t("welcomeTitle")}
					</h4>
					<p className="mt-2 text-sm leading-6 text-gray-500">
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
						className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
					>
						<span aria-hidden="true">😿</span>
						<span>{authError}</span>
					</div>
				) : null}

				<div className="mt-4">
					{isRegistering ? (
						<Form key="register" {...registerForm}>
							<form
								className="space-y-6"
								onSubmit={registerForm.handleSubmit(submitRegister)}
							>
								<div className="mx-auto max-w-4xl space-y-6 p-6">
									<div className="space-y-4">
										<FormField
											control={registerForm.control}
											name="username"
											render={({ field }) => (
												<InputField
													label={t("displayNameLabel")}
													description=""
													placeholder=""
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
										<Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
											{t("registerButton")}
										</Button>
										<Link to={"/forgot-password" as never}>
											<Button variant="link" type="button" className="p-0">
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
								<div className="mx-auto max-w-4xl space-y-6 p-6">
									<div className="space-y-4">
										<FormField
											control={loginForm.control}
											name="email"
											render={({ field }) => (
												<InputField
													label={t("emailLabel")}
													description=""
													placeholder=""
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
													field={field}
													type="password"
												/>
											)}
										/>
										<Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
											{t("loginButton")}
										</Button>
										<Link to={"/forgot-password" as never}>
											<Button variant="link" type="button" className="p-0">
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
								<div className="w-full border-t border-gray-200" />
							</div>
							<div className="relative flex justify-center text-sm font-medium leading-6">
								<span className="bg-background rounded-xl px-6">
									{t("orContinueWith")}
								</span>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-2 gap-4">
							<button
								onClick={() => startOAuth("discord")}
								className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#5865F2] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0] dark:border-white/20"
							>
								<SiDiscord className="h-5" />
								<span className="text-sm font-semibold leading-6">Discord</span>
							</button>

							<button
								onClick={() => startOAuth("eurofurence")}
								className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#005953] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1D9BF0] dark:border-white/20"
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
								className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#24292F] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
							>
								<SiGithub className="h-5" />
								<span className="text-sm font-semibold leading-6">GitHub</span>
							</button>

							<button
								onClick={() => startOAuth("apple")}
								className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#000000] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
							>
								<SiApple className="h-5" />
								<span className="text-sm font-semibold leading-6">Apple</span>
							</button>

							<button
								onClick={() => startOAuth("google")}
								className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#131314] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
							>
								<SiGoogle className="h-4" />
								<span className="text-sm font-semibold leading-6">Google</span>
							</button>

							<button
								onClick={() => startOAuth("twitch")}
								className="flex w-full items-center justify-center gap-3 rounded-md border border-black/20 bg-[#6441A5] px-3 py-1.5 text-white focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#24292F] dark:border-white/20"
							>
								<SiTwitch className="h-5" />
								<span className="text-sm font-semibold leading-6">Twitch</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
