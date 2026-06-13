import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "@/components/fields/InputField";
import { RichBioEditor } from "@/components/profile/RichBioEditor";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
									label="Display name"
									description="The name shown across the app."
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
									label="Status"
									description="A short line under your name."
									placeholder="e.g. open for commissions"
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
									<FormLabel>Bio</FormLabel>
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
										label="Pronouns"
										description=""
										placeholder="they/them"
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
										label="Location"
										description=""
										placeholder="Somewhere nice"
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
									<FormLabel>Birthday</FormLabel>
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
					</div>

					<div className="space-y-4">
						<h3 className="text-sm font-semibold text-muted-foreground">
							Social links
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
										field={field}
										maxLength={60}
									/>
								)}
							/>
						</div>
					</div>

					<Button type="submit" disabled={saving || bioUploading}>
						{bioUploading
							? "Uploading image…"
							: saving
								? "Saving…"
								: "Save profile"}
					</Button>
				</form>
			</Form>

			<aside className="xl:sticky xl:top-6 xl:h-fit">
				<Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
					Live preview
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
