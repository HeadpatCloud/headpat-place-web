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
import { useTranslations } from "@/lib/i18n";
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
	const t = useTranslations("accountPages");
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
			toast.error(r.error.message ?? t("updateEmailFailed"));
			return;
		}
		toast.success(t("verificationEmailSent"));
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
			toast.error(r.error.message ?? t("sendVerificationFailed"));
			return;
		}
		toast.success(t("verificationEmailSent"));
	}

	async function changePassword(values: z.infer<typeof passwordSchema>) {
		const r = await authClient.changePassword({
			currentPassword: values.password,
			newPassword: values.newpassword,
		});
		if (r.error) {
			toast.error(r.error.message ?? t("updatePasswordFailed"));
			return;
		}
		toast.success(t("passwordUpdated"));
		passwordForm.reset({ password: "", newpassword: "" });
	}

	return (
		<div className="space-y-8">
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<Label className="text-sm font-semibold">{t("emailAddress")}</Label>
					{emailVerified ? (
						<Badge className="bg-primary/15 text-primary hover:bg-primary/15">
							{t("verified")}
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="border-border text-muted-foreground"
						>
							{t("unverified")}
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground">
					{t("currentlyPrefix")}{" "}
					<span className="text-foreground">{email}</span>
					{"."}
					{emailVerified ? t("emailVerifiedHint") : t("emailUnverifiedHint")}
				</p>
				{!emailVerified ? (
					<Button
						variant="outline"
						size="sm"
						disabled={resending}
						onClick={resendVerification}
					>
						{resending ? t("sending") : t("resendVerification")}
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
									label={t("newEmail")}
									description={t("newEmailDescription")}
									placeholder=""
									field={field}
								/>
							)}
						/>
						<Button type="submit" variant="outline" size="sm">
							{t("updateEmail")}
						</Button>
					</form>
				</Form>
			</div>

			<Separator />

			<div className="space-y-3">
				<Label className="text-sm font-semibold">{t("profileUrl")}</Label>
				<p className="text-sm text-muted-foreground">
					{t("profileUrlDescription")}
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
									<div className="flex items-stretch">
										<span className="inline-flex select-none items-center whitespace-nowrap rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
											headpat.place/user/
										</span>
										<FormControl>
											<Input
												{...field}
												type="text"
												placeholder={profile.profileUrl}
												className="rounded-l-none"
											/>
										</FormControl>
									</div>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" variant="outline" size="sm">
							{t("saveUrl")}
						</Button>
					</form>
				</Form>
			</div>

			<Separator />

			<div className="space-y-3">
				<Label className="text-sm font-semibold">{t("password")}</Label>
				<p className="text-sm text-muted-foreground">
					{t("passwordDescription")}
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
									label={t("currentPassword")}
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
									label={t("newPassword")}
									description={t("newPasswordDescription")}
									placeholder=""
									field={field}
									type="password"
								/>
							)}
						/>
						<Button type="submit" variant="outline" size="sm">
							{t("updatePassword")}
						</Button>
					</form>
				</Form>
			</div>

			<Separator />

			<div className="space-y-3">
				<Label className="text-sm font-semibold">{t("timezone")}</Label>
				<p className="text-sm text-muted-foreground">
					{t("timezoneDescription")}
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
