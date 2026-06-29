import { CakeIcon } from "lucide-react";
import { GradientBanner } from "@/components/GradientBanner";
import { RichBio } from "@/components/profile/RichBio";
import { useStorageUrl } from "@/components/StorageImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatBirthday } from "@/lib/birthday";
import { useTranslations } from "@/lib/i18n";

export type PreviewData = {
	displayName?: string | null;
	status?: string | null;
	bio?: string | null;
	bioHtml?: string | null;
	pronouns?: string | null;
	location?: string | null;
	birthday?: string | Date | null;
	birthdayShowDay?: boolean;
	birthdayShowYear?: boolean;
	discordName?: string | null;
	telegramName?: string | null;
	furaffinityName?: string | null;
	xName?: string | null;
	twitchName?: string | null;
	blueskyName?: string | null;
};

type Props = {
	data: PreviewData;
	fallbackName: string;
	avatarFileId?: string | null;
	bannerFileId?: string | null;
	followersCount: number;
	followingCount: number;
	badges?: string[] | null;
};

function socialPills(d: PreviewData) {
	const out: string[] = [];
	if (d.discordName) out.push(`Discord: ${d.discordName}`);
	if (d.telegramName) out.push(`Telegram: ${d.telegramName}`);
	if (d.furaffinityName) out.push(`FA: ${d.furaffinityName}`);
	if (d.xName) out.push(`X: ${d.xName}`);
	if (d.twitchName) out.push(`Twitch: ${d.twitchName}`);
	if (d.blueskyName) out.push(`Bluesky: ${d.blueskyName}`);
	return out;
}

export function ProfilePreviewCard({
	data,
	fallbackName,
	avatarFileId,
	bannerFileId,
	followersCount,
	followingCount,
	badges,
}: Props) {
	const t = useTranslations("accountPages");
	const avatarUrl = useStorageUrl("avatar", avatarFileId, "md");
	const name = data.displayName?.trim() || fallbackName;
	const pills = socialPills(data);

	return (
		<div className="overflow-hidden rounded-2xl border border-border bg-background">
			<GradientBanner kind="banner" fileId={bannerFileId} aspect="3/1" />
			<div className="px-4 pb-4">
				<div className="-mt-10 flex items-end gap-3">
					<Avatar className="size-20 rounded-2xl border border-border ring-4 ring-background">
						<AvatarImage
							src={avatarUrl.data?.url}
							alt={name}
							className="rounded-2xl"
						/>
						<AvatarFallback className="rounded-2xl text-xl">
							{name.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 pb-1">
						<h3 className="truncate text-lg font-extrabold tracking-tight">
							{name}
						</h3>
						{data.status?.trim() ? (
							<p className="truncate text-sm text-muted-foreground">
								{data.status}
							</p>
						) : null}
					</div>
				</div>

				<div className="mt-3 space-y-3">
					{data.bioHtml?.trim() ? (
						<RichBio html={data.bioHtml} className="text-sm" />
					) : data.bio?.trim() ? (
						<p className="whitespace-pre-wrap text-sm">{data.bio}</p>
					) : null}
					{data.pronouns?.trim() || data.location?.trim() || data.birthday ? (
						<div className="flex flex-wrap gap-2">
							{data.pronouns?.trim() ? (
								<Badge variant="secondary">{data.pronouns}</Badge>
							) : null}
							{data.location?.trim() ? (
								<Badge variant="secondary">{data.location}</Badge>
							) : null}
							{data.birthday ? (
								<Badge variant="secondary" className="gap-1">
									<CakeIcon className="size-3.5" />
									{formatBirthday(data.birthday, {
										showDay: data.birthdayShowDay ?? true,
										showYear: data.birthdayShowYear ?? true,
									})}
								</Badge>
							) : null}
							{(badges ?? []).map((b) => (
								<Badge key={b}>{b}</Badge>
							))}
						</div>
					) : null}
					<Separator />
					<div className="flex gap-6 text-sm">
						<span>
							<span className="font-medium">{followersCount}</span>
							<span className="text-muted-foreground"> {t("followers")}</span>
						</span>
						<span>
							<span className="font-medium">{followingCount}</span>
							<span className="text-muted-foreground"> {t("following")}</span>
						</span>
					</div>
					{pills.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{pills.map((p) => (
								<span
									key={p}
									className="rounded-full border border-transparent bg-primary/15 px-3 py-1 text-xs text-primary"
								>
									{p}
								</span>
							))}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
