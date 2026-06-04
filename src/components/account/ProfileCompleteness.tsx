import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type CompletenessProfile = {
	avatarFileId?: string | null;
	bannerFileId?: string | null;
	bio?: string | null;
	status?: string | null;
	pronouns?: string | null;
	birthday?: string | Date | null;
	location?: string | null;
	discordName?: string | null;
	telegramName?: string | null;
	furaffinityName?: string | null;
	xName?: string | null;
	twitchName?: string | null;
	blueskyName?: string | null;
};

function hasAnySocial(p: CompletenessProfile) {
	return Boolean(
		p.discordName ||
			p.telegramName ||
			p.furaffinityName ||
			p.xName ||
			p.twitchName ||
			p.blueskyName,
	);
}

export function ProfileCompleteness({
	profile,
}: {
	profile: CompletenessProfile;
}) {
	const items = [
		{ label: "Avatar", done: Boolean(profile.avatarFileId) },
		{ label: "Banner", done: Boolean(profile.bannerFileId) },
		{ label: "Bio", done: Boolean(profile.bio?.trim()) },
		{ label: "Status", done: Boolean(profile.status?.trim()) },
		{ label: "Pronouns", done: Boolean(profile.pronouns?.trim()) },
		{ label: "Birthday", done: Boolean(profile.birthday) },
		{ label: "Location", done: Boolean(profile.location?.trim()) },
		{ label: "A social link", done: hasAnySocial(profile) },
	];
	const done = items.filter((i) => i.done).length;
	const pct = Math.round((done / items.length) * 100);
	const complete = pct === 100;

	return (
		<div className="rounded-xl border border-border bg-card p-5">
			<div className="flex items-baseline justify-between">
				<h3 className="text-sm font-semibold">Profile completeness</h3>
				<span
					className={cn(
						"text-sm font-bold tabular-nums",
						complete ? "text-primary" : "text-foreground",
					)}
				>
					{pct}%
				</span>
			</div>
			<Progress value={pct} className="mt-3 h-2" />
			<p className="mt-3 text-sm text-muted-foreground">
				{complete
					? "Your profile is looking great — everything's filled in."
					: "Add the rest to help others find and recognize you."}
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{items.map((i) => (
					<span
						key={i.label}
						className={cn(
							"inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
							i.done
								? "border-primary/30 bg-primary/10 text-primary"
								: "border-border text-muted-foreground",
						)}
					>
						{i.done ? (
							<Check className="size-3.5" />
						) : (
							<span className="size-1.5 rounded-full bg-muted-foreground/50" />
						)}
						{i.label}
					</span>
				))}
			</div>
		</div>
	);
}
