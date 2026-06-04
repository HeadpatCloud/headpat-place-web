import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "@/components/fields/InputField";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ProfilePreviewCard } from "./ProfilePreviewCard";
import type { AccountProfile } from "./types";

const schema = z.object({
	displayName: z.string().max(120).optional(),
	status: z.string().max(120).optional(),
	bio: z.string().max(2000).optional(),
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

export function ProfileSection({ profile, onSave, saving }: Props) {
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: {
			displayName: "",
			status: "",
			bio: "",
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

	useEffect(() => {
		form.reset({
			displayName: profile.displayName ?? "",
			status: profile.status ?? "",
			bio: profile.bio ?? "",
			pronouns: profile.pronouns ?? "",
			location: profile.location ?? "",
			birthday: profile.birthday ? new Date(profile.birthday) : null,
			discordName: profile.discordName ?? "",
			telegramName: profile.telegramName ?? "",
			furaffinityName: profile.furaffinityName ?? "",
			xName: profile.xName ?? "",
			twitchName: profile.twitchName ?? "",
			blueskyName: profile.blueskyName ?? "",
		});
	}, [profile, form]);

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
							name="bio"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bio</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											rows={4}
											maxLength={2000}
											placeholder="Tell people about yourself…"
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
									<div className="flex items-center gap-2">
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														type="button"
														variant="outline"
														className={cn(
															"w-[240px] justify-start text-left font-normal",
															!field.value && "text-muted-foreground",
														)}
													>
														<CalendarIcon className="mr-2 size-4" />
														{field.value
															? format(field.value, "d MMMM yyyy")
															: "Pick a date"}
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													captionLayout="dropdown"
													startMonth={new Date(1920, 0)}
													endMonth={new Date()}
													defaultMonth={field.value ?? new Date(2000, 0)}
													selected={field.value ?? undefined}
													onSelect={(d) => field.onChange(d ?? null)}
												/>
											</PopoverContent>
										</Popover>
										{field.value ? (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												aria-label="Clear birthday"
												onClick={() => field.onChange(null)}
											>
												<X className="size-4" />
											</Button>
										) : null}
									</div>
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

					<Button type="submit" disabled={saving}>
						{saving ? "Saving…" : "Save profile"}
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
