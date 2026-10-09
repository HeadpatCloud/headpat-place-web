import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import InputField from "@/components/fields/InputField";
import { RichBioEditor } from "@/components/profile/RichBioEditor";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "@/lib/i18n";
import { z } from "@/lib/zod";
import { BirthdayPicker } from "./BirthdayPicker";
import { ProfilePreviewCard } from "./ProfilePreviewCard";
import type { AccountProfile } from "./types";

const schema = z.object({
	displayName: z.string().max(120).optional(),
	status: z.string().max(120).optional(),
	bioHtml: z.string().max(20000).optional(),
	pronouns: z.string().max(60).optional(),
	location: z.string().max(120).optional(),
	birthday: z.date().nullable().optional(),
	birthdayVisible: z.boolean().optional(),
	birthdayShowDay: z.boolean().optional(),
	birthdayShowYear: z.boolean().optional(),
	discordName: z.string().max(60).optional(),
	telegramName: z.string().max(60).optional(),
	furaffinityName: z.string().max(60).optional(),
	xName: z.string().max(60).optional(),
	twitchName: z.string().max(60).optional(),
	blueskyName: z.string().max(60).optional(),
});

type Values = z.infer<typeof schema>;

type Props = {
	profile: AccountProfile;
	onSave: (values: Values) => Promise<unknown>;
	saving?: boolean;
};

// Seed the editor from a legacy plain-text bio when there's no rich HTML yet.
function plainToHtml(text: string): string {
	const esc = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	return `<p>${esc.replace(/\n/g, "<br>")}</p>`;
}

export function ProfileSection({ profile, onSave, saving }: Props) {
	const t = useTranslations("accountPages");
	const [bioUploading, setBioUploading] = useState(false);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: {
			displayName: "",
			status: "",
			bioHtml: "",
			pronouns: "",
			location: "",
			birthday: null,
			birthdayVisible: true,
			birthdayShowDay: true,
			birthdayShowYear: true,
			discordName: "",
			telegramName: "",
			furaffinityName: "",
			xName: "",
			twitchName: "",
			blueskyName: "",
		},
	});

	const initialBioHtml =
		profile.bioHtml ?? (profile.bio ? plainToHtml(profile.bio) : "");

	useEffect(() => {
		form.reset(
			{
				displayName: profile.displayName ?? "",
				status: profile.status ?? "",
				bioHtml: initialBioHtml,
				pronouns: profile.pronouns ?? "",
				location: profile.location ?? "",
				birthday: profile.birthday ? new Date(profile.birthday) : null,
				birthdayVisible: profile.birthdayVisible ?? true,
				birthdayShowDay: profile.birthdayShowDay ?? true,
				birthdayShowYear: profile.birthdayShowYear ?? true,
				discordName: profile.discordName ?? "",
				telegramName: profile.telegramName ?? "",
				furaffinityName: profile.furaffinityName ?? "",
				xName: profile.xName ?? "",
				twitchName: profile.twitchName ?? "",
				blueskyName: profile.blueskyName ?? "",
			},
			// a profile refetch (e.g. on window focus) must not clobber fields the
			// user is mid-editing — the rich editor keeps its own state, so a plain
			// reset would silently desync what's saved from what's on screen
			{ keepDirtyValues: true },
		);
	}, [profile, form, initialBioHtml]);

	const draft = form.watch();

	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit((v) => onSave(v))}
					className="space-y-8"
				>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="displayName"
							render={({ field }) => (
								<InputField
									label={t("displayName")}
									description={t("displayNameDescription")}
									placeholder=""
									field={field}
									maxLength={120}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<InputField
									label={t("statusLabel")}
									description={t("statusDescription")}
									placeholder={t("statusPlaceholder")}
									field={field}
									maxLength={120}
								/>
							)}
						/>
						<FormField
							control={form.control}
							name="bioHtml"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("bioLabel")}</FormLabel>
									<FormControl>
										<RichBioEditor
											initialHtml={initialBioHtml}
											onChange={field.onChange}
											onUploadingChange={setBioUploading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="pronouns"
								render={({ field }) => (
									<InputField
										label={t("pronouns")}
										description=""
										placeholder={t("pronounsPlaceholder")}
										field={field}
										maxLength={60}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="location"
								render={({ field }) => (
									<InputField
										label={t("location")}
										description=""
										placeholder={t("locationPlaceholder")}
										field={field}
										maxLength={120}
									/>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="birthday"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>{t("birthday")}</FormLabel>
									<FormControl>
										<BirthdayPicker
											value={field.value ?? null}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{form.watch("birthday") ? (
							<div className="flex flex-col gap-3 rounded-lg border border-border p-3">
								<span className="text-xs font-medium text-muted-foreground">
									{t("birthdayVisibility")}
								</span>
								<FormField
									control={form.control}
									name="birthdayVisible"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between gap-2 space-y-0">
											<FormLabel className="font-normal">
												{t("showBirthdayAtAll")}
											</FormLabel>
											<FormControl>
												<Switch
													checked={field.value ?? true}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
								{form.watch("birthdayVisible") !== false ? (
									<>
										<FormField
											control={form.control}
											name="birthdayShowDay"
											render={({ field }) => (
												<FormItem className="flex items-center justify-between gap-2 space-y-0">
													<FormLabel className="font-normal">
														{t("showBirthdayDay")}
													</FormLabel>
													<FormControl>
														<Switch
															checked={field.value ?? true}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="birthdayShowYear"
											render={({ field }) => (
												<FormItem className="flex items-center justify-between gap-2 space-y-0">
													<FormLabel className="font-normal">
														{t("showBirthdayYear")}
													</FormLabel>
													<FormControl>
														<Switch
															checked={field.value ?? true}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</>
								) : null}
							</div>
						) : null}
					</div>

					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-muted-foreground">
							{t("socialLinks")}
						</h3>
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="discordName"
								render={({ field }) => (
									<InputField
										label="Discord"
										description=""
										placeholder=""
										field={field}
										maxLength={60}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="telegramName"
								render={({ field }) => (
									<InputField
										label="Telegram"
										description=""
										placeholder=""
										prefix="t.me/"
										field={field}
										maxLength={60}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="furaffinityName"
								render={({ field }) => (
									<InputField
										label="FurAffinity"
										description=""
										placeholder=""
										prefix="furaffinity.net/user/"
										field={field}
										maxLength={60}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="xName"
								render={({ field }) => (
									<InputField
										label="X / Twitter"
										description=""
										placeholder=""
										prefix="x.com/"
										field={field}
										maxLength={60}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="twitchName"
								render={({ field }) => (
									<InputField
										label="Twitch"
										description=""
										placeholder=""
										prefix="twitch.tv/"
										field={field}
										maxLength={60}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="blueskyName"
								render={({ field }) => (
									<InputField
										label="Bluesky"
										description=""
										placeholder=""
										prefix="bsky.app/profile/"
										field={field}
										maxLength={60}
									/>
								)}
							/>
						</div>
					</div>

					<Button type="submit" disabled={saving || bioUploading}>
						{bioUploading
							? t("uploadingImage")
							: saving
								? t("saving")
								: t("saveProfile")}
					</Button>
				</form>
			</Form>

			<aside className="xl:sticky xl:top-6 xl:h-fit">
				<Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
					{t("livePreview")}
				</Label>
				<ProfilePreviewCard
					data={draft}
					fallbackName={profile.name || profile.profileUrl}
					avatarFileId={profile.avatarFileId}
					bannerFileId={profile.bannerFileId}
					followersCount={profile.followersCount}
					followingCount={profile.followingCount}
					badges={profile.badges}
				/>
			</aside>
		</div>
	);
}
