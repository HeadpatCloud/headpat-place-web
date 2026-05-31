import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AvatarBannerUpload } from "@/components/AvatarBannerUpload";
import InputField from "@/components/fields/InputField";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient, useSession } from "@/lib/auth-client";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_app/account/")({
	component: AccountPage,
});

const emailSchema = z.object({
	email: z.string().email().trim(),
	password: z.string().trim().min(8).max(128),
});
const profileUrlSchema = z.object({
	profileUrl: z.string().trim().min(3).max(64),
});
const passwordSchema = z.object({
	password: z.string().trim().min(8).max(264),
	newpassword: z.string().trim().min(8).max(264),
});
const profileFieldsSchema = z.object({
	displayName: z.string().max(120).optional(),
	bio: z.string().max(2000).optional(),
	status: z.string().max(120).optional(),
	pronouns: z.string().max(60).optional(),
	location: z.string().max(120).optional(),
});
const socialsSchema = z.object({
	discordName: z.string().max(60).optional(),
	telegramName: z.string().max(60).optional(),
	furaffinityName: z.string().max(60).optional(),
	xName: z.string().max(60).optional(),
	twitchName: z.string().max(60).optional(),
	blueskyName: z.string().max(60).optional(),
});

function AccountPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!isPending && !session?.user) navigate({ to: "/login" as never });
	}, [session, isPending, navigate]);

	const profileQuery = useQuery({
		...orpc.profile.me.queryOptions({ input: undefined }),
		enabled: !!session?.user,
	});

	const notifications = useQuery({
		...orpc.notification.list.queryOptions({ input: {} }),
		enabled: !!session?.user,
	});
	const unreadCount = (notifications.data?.items ?? []).filter(
		(n: { read: boolean }) => !n.read,
	).length;

	const updateProfile = useMutation({
		mutationFn: async (input: Parameters<typeof client.profile.update>[0]) =>
			client.profile.update(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.profile.me.queryKey() });
			toast.success("Saved.");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const emailForm = useForm<z.infer<typeof emailSchema>>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: "", password: "" },
	});
	const profileUrlForm = useForm<z.infer<typeof profileUrlSchema>>({
		resolver: zodResolver(profileUrlSchema),
		defaultValues: { profileUrl: "" },
	});
	const passwordForm = useForm<z.infer<typeof passwordSchema>>({
		resolver: zodResolver(passwordSchema),
		defaultValues: { password: "", newpassword: "" },
	});
	const profileFieldsForm = useForm<z.infer<typeof profileFieldsSchema>>({
		resolver: zodResolver(profileFieldsSchema),
		defaultValues: {
			displayName: "",
			bio: "",
			status: "",
			pronouns: "",
			location: "",
		},
	});
	const socialsForm = useForm<z.infer<typeof socialsSchema>>({
		resolver: zodResolver(socialsSchema),
		defaultValues: {
			discordName: "",
			telegramName: "",
			furaffinityName: "",
			xName: "",
			twitchName: "",
			blueskyName: "",
		},
	});

	useEffect(() => {
		if (!profileQuery.data) return;
		profileFieldsForm.reset({
			displayName: profileQuery.data.displayName ?? "",
			bio: profileQuery.data.bio ?? "",
			status: profileQuery.data.status ?? "",
			pronouns: profileQuery.data.pronouns ?? "",
			location: profileQuery.data.location ?? "",
		});
		socialsForm.reset({
			discordName: profileQuery.data.discordName ?? "",
			telegramName: profileQuery.data.telegramName ?? "",
			furaffinityName: profileQuery.data.furaffinityName ?? "",
			xName: profileQuery.data.xName ?? "",
			twitchName: profileQuery.data.twitchName ?? "",
			blueskyName: profileQuery.data.blueskyName ?? "",
		});
	}, [profileQuery.data, profileFieldsForm, socialsForm]);

	async function handleEmailChange(values: z.infer<typeof emailSchema>) {
		const r = await authClient.changeEmail({ newEmail: values.email });
		if (r.error) {
			toast.error(r.error.message ?? "Failed to update email");
			return;
		}
		toast.success("Verification email sent.");
	}

	async function handlePasswordReset(values: z.infer<typeof passwordSchema>) {
		const r = await authClient.changePassword({
			currentPassword: values.password,
			newPassword: values.newpassword,
		});
		if (r.error) {
			toast.error(r.error.message ?? "Failed to update password");
			return;
		}
		toast.success("Password updated.");
		passwordForm.reset({ password: "", newpassword: "" });
	}

	async function handleProfileUrlChange(
		values: z.infer<typeof profileUrlSchema>,
	) {
		updateProfile.mutate({ profileUrl: values.profileUrl });
	}

	async function deleteAccount() {
		const r = await authClient.deleteUser();
		if (r.error) {
			toast.error(r.error.message ?? "Failed to delete account");
			return;
		}
		toast.success("Account deleted.");
		navigate({ to: "/" });
	}

	if (isPending) return <p className="text-muted-foreground p-4">Loading…</p>;
	if (!session?.user) return null;

	return (
		<Tabs defaultValue="general" className="w-full">
			<div className="flex flex-col items-center justify-center">
				<TabsList className="grid w-full grid-cols-3 sm:max-w-4xl">
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="frontpage">Frontpage</TabsTrigger>
					<TabsTrigger value="socials">Socials</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="general">
				<div className="mx-auto grid max-w-4xl grid-cols-3 gap-3 px-4 pt-6">
					<StatCard
						label="Followers"
						value={profileQuery.data?.followersCount ?? 0}
						accent="brand"
					/>
					<StatCard
						label="Following"
						value={profileQuery.data?.followingCount ?? 0}
					/>
					<StatCard label="Unread" value={unreadCount} accent="warm" />
				</div>
				<div className="divide-y divide-black/5 dark:divide-white/5">
					{/* Email */}
					<div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
						<div>
							<h4 className="text-base font-semibold leading-7">
								Change Email
							</h4>
							<p className="mt-1 text-sm leading-6 text-gray-400">
								Change your email address. A verification email will be sent.
							</p>
						</div>
						<Form {...emailForm}>
							<form
								onSubmit={emailForm.handleSubmit(handleEmailChange)}
								className="md:col-span-2"
							>
								<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
									<div className="col-span-full">
										<FormField
											control={emailForm.control}
											name="email"
											render={({ field }) => (
												<InputField
													label="E-Mail"
													description="Your new email address."
													placeholder=""
													field={field}
												/>
											)}
										/>
									</div>
									<div className="col-span-full">
										<FormField
											control={emailForm.control}
											name="password"
											render={({ field }) => (
												<InputField
													label="Password"
													description="Your current password."
													placeholder=""
													field={field}
													type="password"
												/>
											)}
										/>
									</div>
								</div>
								<div className="mt-8 flex">
									<Button type="submit" variant="outline">
										Save
									</Button>
								</div>
							</form>
						</Form>
					</div>

					{/* Profile URL */}
					<div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
						<div>
							<h4 className="text-base font-semibold leading-7">Profile URL</h4>
							<p className="mt-1 text-sm leading-6 text-gray-400">
								The URL where your profile is reachable.
							</p>
						</div>
						<Form {...profileUrlForm}>
							<form
								onSubmit={profileUrlForm.handleSubmit(handleProfileUrlChange)}
							>
								<div className="md:col-span-2">
									<Label htmlFor="profileUrl">URL</Label>
									<FormField
										control={profileUrlForm.control}
										name="profileUrl"
										render={({ field }) => (
											<FormItem className="col-span-full flex items-center">
												<div className="mt-2 w-full">
													<div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex rounded-md border focus-within:ring-[3px]">
														<span className="dark:bg-input/30 flex select-none items-center pl-3 text-gray-400 sm:text-sm">
															headpat.place/user/
														</span>
														<FormControl>
															<Input
																{...field}
																type="text"
																placeholder={
																	profileQuery.data?.profileUrl ?? ""
																}
																className="w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 pl-1 !ring-0 focus:ring-0 sm:text-sm"
															/>
														</FormControl>
													</div>
													<FormMessage />
												</div>
											</FormItem>
										)}
									/>
									<div className="mt-8 flex">
										<Button type="submit" variant="outline">
											Save
										</Button>
									</div>
								</div>
							</form>
						</Form>
					</div>

					{/* Password */}
					<div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
						<div>
							<h4 className="text-base font-semibold">Change password</h4>
							<p className="mt-1 text-sm leading-6 text-gray-400">
								Change your password.
							</p>
						</div>
						<Form {...passwordForm}>
							<form
								className="md:col-span-2"
								onSubmit={passwordForm.handleSubmit(handlePasswordReset)}
							>
								<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
									<div className="col-span-full">
										<FormField
											control={passwordForm.control}
											name="password"
											render={({ field }) => (
												<InputField
													label="Current password"
													description="Your current password."
													placeholder=""
													field={field}
													type="password"
												/>
											)}
										/>
									</div>
									<div className="col-span-full">
										<FormField
											control={passwordForm.control}
											name="newpassword"
											render={({ field }) => (
												<InputField
													label="New password"
													description="Your new password."
													placeholder=""
													field={field}
													type="password"
												/>
											)}
										/>
									</div>
									<div className="col-span-full">
										<Button type="submit" variant="outline">
											Save
										</Button>
									</div>
								</div>
							</form>
						</Form>
					</div>

					{/* Privacy toggles */}
					<div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
						<div>
							<h4 className="text-base font-semibold">Privacy</h4>
							<p className="mt-1 text-sm leading-6 text-gray-400">
								Control whether your profile is indexed and whether NSFW content
								is shown to you.
							</p>
						</div>
						<div className="grid grid-cols-1 gap-y-4 sm:max-w-xl">
							<PrivacyToggles
								indexing={profileQuery.data?.indexingEnabled ?? true}
								nsfw={profileQuery.data?.nsfwEnabled ?? false}
								email={profileQuery.data?.emailNotifications ?? true}
								onChange={(field, value) =>
									updateProfile.mutate({ [field]: value } as never)
								}
							/>
						</div>
					</div>

					{/* Two-factor */}
					<div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
						<div>
							<h4 className="text-base font-semibold">Two-factor auth</h4>
							<p className="mt-1 text-sm leading-6 text-gray-400">
								Add a second factor with an authenticator app (TOTP).
							</p>
						</div>
						<div className="grid grid-cols-1 gap-y-4 sm:max-w-xl">
							<TwoFactorSection />
						</div>
					</div>

					{/* Delete */}
					<div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
						<div>
							<h4 className="text-base font-semibold">Delete Account</h4>
							<p className="mt-1 text-sm leading-6 text-gray-400">
								Warning: This action cannot be undone.
							</p>
						</div>
						<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
							<div className="col-span-full">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button type="button" variant="destructive">
											Delete Account
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogTitle>
											Are you absolutely sure?
										</AlertDialogTitle>
										<AlertDialogDescription>
											This action cannot be undone. This will permanently delete
											all your data.
										</AlertDialogDescription>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction asChild>
												<Button
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
													onClick={deleteAccount}
												>
													Delete Account
												</Button>
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					</div>
				</div>
			</TabsContent>

			<TabsContent value="frontpage">
				<div className="mx-auto max-w-4xl space-y-6 p-6">
					<div className="flex flex-wrap gap-8">
						<AvatarBannerUpload
							kind="avatar"
							currentFileId={profileQuery.data?.avatarFileId}
							onUploaded={async (fileId) => {
								await updateProfile.mutateAsync({ avatarFileId: fileId });
							}}
						/>
						<AvatarBannerUpload
							kind="banner"
							currentFileId={profileQuery.data?.bannerFileId}
							onUploaded={async (fileId) => {
								await updateProfile.mutateAsync({ bannerFileId: fileId });
							}}
						/>
					</div>
				</div>
				<Form {...profileFieldsForm}>
					<form
						onSubmit={profileFieldsForm.handleSubmit((v) =>
							updateProfile.mutate(v),
						)}
						className="mx-auto max-w-4xl space-y-6 p-6"
					>
						<div className="space-y-4">
							<FormField
								control={profileFieldsForm.control}
								name="displayName"
								render={({ field }) => (
									<InputField
										label="Display name"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={profileFieldsForm.control}
								name="status"
								render={({ field }) => (
									<InputField
										label="Status"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={profileFieldsForm.control}
								name="bio"
								render={({ field }) => (
									<InputField
										label="Bio"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={profileFieldsForm.control}
								name="pronouns"
								render={({ field }) => (
									<InputField
										label="Pronouns"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={profileFieldsForm.control}
								name="location"
								render={({ field }) => (
									<InputField
										label="Location"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<Button type="submit">Save</Button>
						</div>
					</form>
				</Form>
			</TabsContent>

			<TabsContent value="socials">
				<Form {...socialsForm}>
					<form
						onSubmit={socialsForm.handleSubmit((v) => updateProfile.mutate(v))}
						className="mx-auto max-w-4xl space-y-6 p-6"
					>
						<div className="space-y-4">
							<FormField
								control={socialsForm.control}
								name="discordName"
								render={({ field }) => (
									<InputField
										label="Discord"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={socialsForm.control}
								name="telegramName"
								render={({ field }) => (
									<InputField
										label="Telegram"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={socialsForm.control}
								name="furaffinityName"
								render={({ field }) => (
									<InputField
										label="FurAffinity"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={socialsForm.control}
								name="xName"
								render={({ field }) => (
									<InputField
										label="X / Twitter"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={socialsForm.control}
								name="twitchName"
								render={({ field }) => (
									<InputField
										label="Twitch"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<FormField
								control={socialsForm.control}
								name="blueskyName"
								render={({ field }) => (
									<InputField
										label="Bluesky"
										description=""
										placeholder=""
										field={field}
									/>
								)}
							/>
							<Button type="submit">Save</Button>
						</div>
					</form>
				</Form>
			</TabsContent>
		</Tabs>
	);
}

function PrivacyToggles({
	indexing,
	nsfw,
	email,
	onChange,
}: {
	indexing: boolean;
	nsfw: boolean;
	email: boolean;
	onChange: (
		field: "indexingEnabled" | "nsfwEnabled" | "emailNotifications",
		value: boolean,
	) => void;
}) {
	return (
		<div className="space-y-4">
			<label className="flex items-center justify-between gap-4">
				<span className="text-sm">
					<span className="font-medium">Allow profile indexing</span>
					<br />
					<span className="text-muted-foreground text-xs">
						Search engines and the user discovery page can find you.
					</span>
				</span>
				<Switch
					checked={indexing}
					onCheckedChange={(v) => onChange("indexingEnabled", v)}
				/>
			</label>
			<label className="flex items-center justify-between gap-4">
				<span className="text-sm">
					<span className="font-medium">Show NSFW content</span>
					<br />
					<span className="text-muted-foreground text-xs">
						Reveal posts and gallery items flagged as NSFW.
					</span>
				</span>
				<Switch
					checked={nsfw}
					onCheckedChange={(v) => onChange("nsfwEnabled", v)}
				/>
			</label>
			<label className="flex items-center justify-between gap-4">
				<span className="text-sm">
					<span className="font-medium">Email notifications</span>
					<br />
					<span className="text-muted-foreground text-xs">
						Also send notifications (follows, messages, replies) to your email.
					</span>
				</span>
				<Switch
					checked={email}
					onCheckedChange={(v) => onChange("emailNotifications", v)}
				/>
			</label>
		</div>
	);
}

function TwoFactorSection() {
	const { data: session, refetch } = useSession();
	const enabled = session?.user?.twoFactorEnabled;
	const [password, setPassword] = useState("");
	const [setupUri, setSetupUri] = useState<string | null>(null);
	const [verifyCode, setVerifyCode] = useState("");
	const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
	const [busy, setBusy] = useState(false);

	async function startEnroll() {
		setBusy(true);
		const r = await authClient.twoFactor.enable({ password });
		setBusy(false);
		if (r.error) {
			toast.error(r.error.message ?? "Failed to start 2FA setup");
			return;
		}
		setSetupUri(r.data?.totpURI ?? null);
		setBackupCodes(r.data?.backupCodes ?? null);
	}

	async function confirmEnroll() {
		setBusy(true);
		const r = await authClient.twoFactor.verifyTotp({ code: verifyCode });
		setBusy(false);
		if (r.error) {
			toast.error(r.error.message ?? "Invalid code");
			return;
		}
		toast.success("2FA enabled.");
		setSetupUri(null);
		setVerifyCode("");
		await refetch();
	}

	async function disable() {
		setBusy(true);
		const r = await authClient.twoFactor.disable({ password });
		setBusy(false);
		if (r.error) {
			toast.error(r.error.message ?? "Failed to disable 2FA");
			return;
		}
		toast.success("2FA disabled.");
		setPassword("");
		await refetch();
	}

	if (enabled) {
		return (
			<div className="space-y-3">
				<p className="text-sm">
					Two-factor authentication is <strong>enabled</strong>.
				</p>
				<div className="space-y-2">
					<Label>Confirm password to disable</Label>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<Button
					variant="destructive"
					disabled={busy || password.length < 6}
					onClick={disable}
				>
					Disable 2FA
				</Button>
			</div>
		);
	}

	if (setupUri) {
		return (
			<div className="space-y-3">
				<p className="text-sm">
					Scan this URI in your authenticator app, then enter the 6-digit code:
				</p>
				<code className="block break-all rounded bg-muted px-2 py-1 text-xs">
					{setupUri}
				</code>
				{backupCodes && backupCodes.length > 0 ? (
					<div>
						<p className="text-sm font-medium">Backup codes (save these):</p>
						<ul className="grid grid-cols-2 gap-1 font-mono text-sm">
							{backupCodes.map((c) => (
								<li key={c}>{c}</li>
							))}
						</ul>
					</div>
				) : null}
				<div className="space-y-2">
					<Label>6-digit code</Label>
					<InputOTP maxLength={6} value={verifyCode} onChange={setVerifyCode}>
						<InputOTPGroup>
							{Array.from({ length: 6 }).map((_, i) => (
								<InputOTPSlot key={i} index={i} />
							))}
						</InputOTPGroup>
					</InputOTP>
				</div>
				<Button
					disabled={busy || verifyCode.length !== 6}
					onClick={confirmEnroll}
				>
					Confirm
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<p className="text-sm">
				Two-factor authentication is <strong>not enabled</strong>.
			</p>
			<div className="space-y-2">
				<Label>Confirm password</Label>
				<Input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</div>
			<Button disabled={busy || password.length < 6} onClick={startEnroll}>
				Enable 2FA
			</Button>
		</div>
	);
}

function StatCard({
	label,
	value,
	accent,
}: {
	label: string;
	value: number;
	accent?: "brand" | "warm";
}) {
	const color =
		accent === "brand"
			? "text-primary"
			: accent === "warm"
				? "text-[#fb7185]"
				: "";
	return (
		<div className="rounded-xl border bg-card p-4">
			<div className={`text-2xl font-extrabold ${color}`}>{value}</div>
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
		</div>
	);
}
