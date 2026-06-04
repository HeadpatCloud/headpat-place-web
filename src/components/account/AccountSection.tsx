import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import InputField from "@/components/fields/InputField";
import { TimezoneSelect } from "@/components/TimezoneSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import type { AccountProfile } from "./types";

const emailSchema = z.object({ email: z.string().email().trim() });
const profileUrlSchema = z.object({
	profileUrl: z.string().trim().min(3).max(64),
});
const passwordSchema = z.object({
	password: z.string().trim().min(8).max(264),
	newpassword: z.string().trim().min(8).max(264),
});

type Props = {
	profile: AccountProfile;
	email: string;
	emailVerified: boolean;
	onSaveUrl: (profileUrl: string) => Promise<unknown>;
	onChangeTimezone: (tz: string | null) => void;
};

export function AccountSection({
	profile,
	email,
	emailVerified,
	onSaveUrl,
	onChangeTimezone,
}: Props) {
	const [resending, setResending] = useState(false);

	const emailForm = useForm<z.infer<typeof emailSchema>>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: "" },
	});
	const urlForm = useForm<z.infer<typeof profileUrlSchema>>({
		resolver: zodResolver(profileUrlSchema),
		defaultValues: { profileUrl: profile.profileUrl },
	});
	const passwordForm = useForm<z.infer<typeof passwordSchema>>({
		resolver: zodResolver(passwordSchema),
		defaultValues: { password: "", newpassword: "" },
	});

	async function changeEmail(values: z.infer<typeof emailSchema>) {
		const r = await authClient.changeEmail({ newEmail: values.email });
		if (r.error) {
			toast.error(r.error.message ?? "Failed to update email");
			return;
		}
		toast.success("Verification email sent.");
		emailForm.reset({ email: "" });
	}

	async function resendVerification() {
		setResending(true);
		const r = await authClient.sendVerificationEmail({
			email,
			callbackURL: window.location.origin,
		});
		setResending(false);
		if (r.error) {
			toast.error(r.error.message ?? "Couldn't send verification email");
			return;
		}
		toast.success("Verification email sent.");
	}

	async function changePassword(values: z.infer<typeof passwordSchema>) {
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

	return (
		<div className="space-y-8">
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<Label className="text-sm font-semibold">Email address</Label>
					{emailVerified ? (
						<Badge className="bg-primary/15 text-primary hover:bg-primary/15">
							Verified
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="border-border text-muted-foreground"
						>
							Unverified
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground">
					Currently <span className="text-foreground">{email}</span>.
					{emailVerified
						? " Change it below — we'll send a verification link to the new address."
						: " Verify it to secure your account."}
				</p>
				{!emailVerified ? (
					<Button
						variant="outline"
						size="sm"
						disabled={resending}
						onClick={resendVerification}
					>
						{resending ? "Sending…" : "Resend verification email"}
					</Button>
				) : null}
				<Form {...emailForm}>
					<form
						onSubmit={emailForm.handleSubmit(changeEmail)}
						className="max-w-md space-y-3"
					>
						<FormField
							control={emailForm.control}
							name="email"
							render={({ field }) => (
								<InputField
									label="New email"
									description="A verification email goes to this address."
									placeholder=""
									field={field}
								/>
							)}
						/>
						<Button type="submit" variant="outline" size="sm">
							Update email
						</Button>
					</form>
				</Form>
			</div>

			<Separator />

			<div className="space-y-3">
				<Label className="text-sm font-semibold">Profile URL</Label>
				<p className="text-sm text-muted-foreground">
					Where your public profile lives.
				</p>
				<Form {...urlForm}>
					<form
						onSubmit={urlForm.handleSubmit((v) =>
							onSaveUrl(v.profileUrl).then(() =>
								urlForm.reset({ profileUrl: v.profileUrl }),
							),
						)}
						className="max-w-md space-y-3"
					>
						<FormField
							control={urlForm.control}
							name="profileUrl"
							render={({ field }) => (
								<FormItem>
									<div className="flex rounded-md border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
										<span className="flex select-none items-center pl-3 text-sm text-muted-foreground">
											headpat.place/user/
										</span>
										<FormControl>
											<Input
												{...field}
												type="text"
												placeholder={profile.profileUrl}
												className="w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 pl-1 !ring-0 focus:ring-0 sm:text-sm"
											/>
										</FormControl>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" variant="outline" size="sm">
							Save URL
						</Button>
					</form>
				</Form>
			</div>

			<Separator />

			<div className="space-y-3">
				<Label className="text-sm font-semibold">Password</Label>
				<p className="text-sm text-muted-foreground">
					Use a strong password you don't reuse elsewhere.
				</p>
				<Form {...passwordForm}>
					<form
						onSubmit={passwordForm.handleSubmit(changePassword)}
						className="max-w-md space-y-3"
					>
						<FormField
							control={passwordForm.control}
							name="password"
							render={({ field }) => (
								<InputField
									label="Current password"
									description=""
									placeholder=""
									field={field}
									type="password"
								/>
							)}
						/>
						<FormField
							control={passwordForm.control}
							name="newpassword"
							render={({ field }) => (
								<InputField
									label="New password"
									description="At least 8 characters."
									placeholder=""
									field={field}
									type="password"
								/>
							)}
						/>
						<Button type="submit" variant="outline" size="sm">
							Update password
						</Button>
					</form>
				</Form>
			</div>

			<Separator />

			<div className="space-y-3">
				<Label className="text-sm font-semibold">Timezone</Label>
				<p className="text-sm text-muted-foreground">
					Dates and times are shown in this timezone. Defaults to your device's.
				</p>
				<div className="max-w-md">
					<TimezoneSelect
						value={profile.timezone ?? null}
						onChange={onChangeTimezone}
					/>
				</div>
			</div>
		</div>
	);
}
