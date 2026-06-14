import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { CakeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GradientBanner } from "@/components/GradientBanner";
import { RichBio } from "@/components/profile/RichBio";
import { useStorageUrl } from "@/components/StorageImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useTranslations,
} from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/user/$profileUrl/")({
	component: UserProfilePage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		const profileUrl = (params as { profileUrl: string }).profileUrl;
		return seo({
			title: translate(locale, "miscPages.seoTitle"),
			path: `/user/${profileUrl}`,
			locale,
		});
	},
});

function isBirthdayToday(birthday: string | Date | null | undefined) {
	if (!birthday) return false;
	const d = new Date(birthday);
	if (Number.isNaN(d.getTime())) return false;
	const now = new Date();
	return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}

function formatBirthday(birthday: string | Date) {
	return new Date(birthday).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function UserProfilePage() {
	const { profileUrl } = Route.useParams();
	const t = useTranslations("miscPages");
	const profile = useQuery(
		orpc.profile.byUrl.queryOptions({ input: { profileUrl } }),
	);
	const avatarUrl = useStorageUrl("avatar", profile.data?.avatarFileId, "md");

	if (profile.isPending)
		return (
			<main className="space-y-6">
				<div className="overflow-hidden rounded-2xl border">
					<Skeleton className="aspect-[3/1] w-full rounded-none" />
					<div className="px-6 pb-6">
						<div className="-mt-12 flex items-end gap-4">
							<Skeleton className="h-32 w-32 rounded-2xl ring-4 ring-background" />
							<div className="flex-1 space-y-2 pb-1">
								<Skeleton className="h-6 w-44" />
								<Skeleton className="h-4 w-28" />
							</div>
						</div>
						<div className="mt-4 space-y-4">
							<div className="flex gap-2">
								<Skeleton className="h-6 w-20 rounded-full" />
								<Skeleton className="h-6 w-24 rounded-full" />
							</div>
							<Separator />
							<div className="flex gap-6">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-20" />
							</div>
							<Skeleton className="h-24 w-full" />
						</div>
					</div>
				</div>
			</main>
		);
	if (profile.isError || !profile.data)
		return <p className="p-4">{t("profileNotFound")}</p>;
	const p = profile.data;
	const birthday = isBirthdayToday(p.birthday);

	return (
		<main className="space-y-6">
			{birthday ? <BirthdayConfetti /> : null}
			<div className="overflow-hidden rounded-2xl border">
				<GradientBanner kind="banner" fileId={p.bannerFileId} aspect="3/1" />
				<div className="px-6 pb-6">
					<div className="-mt-12 flex items-end gap-4">
						<Avatar className="h-32 w-32 rounded-2xl border border-border ring-4 ring-background">
							<AvatarImage
								src={avatarUrl.data?.url}
								alt={p.displayName ?? p.name ?? p.userId}
								className="rounded-2xl"
							/>
							<AvatarFallback className="rounded-2xl text-3xl">
								{(p.displayName ?? p.name ?? "?").charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1 pb-1">
							<h1 className="truncate text-xl font-extrabold tracking-tight">
								{p.displayName || p.name || p.profileUrl}
							</h1>
							{p.status ? (
								<p className="truncate text-muted-foreground">{p.status}</p>
							) : null}
						</div>
						<FollowButton targetUserId={p.userId} />
					</div>
					<div className="mt-4 space-y-4">
						{birthday ? (
							<div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-primary">
								<CakeIcon className="size-5" />
								<span className="font-semibold">{t("birthdayToday")}</span>
							</div>
						) : null}
						<div className="flex gap-2 flex-wrap">
							{p.pronouns ? (
								<Badge variant="secondary">{p.pronouns}</Badge>
							) : null}
							{p.location ? (
								<Badge variant="secondary">{p.location}</Badge>
							) : null}
							{p.birthday ? (
								<Badge variant="secondary" className="gap-1">
									<CakeIcon className="size-3.5" />
									{formatBirthday(p.birthday)}
								</Badge>
							) : null}
							{(p.badges ?? []).map((b) => (
								<Badge key={b}>{b}</Badge>
							))}
						</div>
						<Separator />
						<div className="flex gap-6 text-sm">
							<Link
								to={`/user/${profileUrl}/followers` as never}
								className="hover:underline"
							>
								<span className="font-medium">{p.followersCount}</span>
								<span className="text-muted-foreground">
									{" "}
									{t("followersLabel")}
								</span>
							</Link>
							<Link
								to={`/user/${profileUrl}/following` as never}
								className="hover:underline"
							>
								<span className="font-medium">{p.followingCount}</span>
								<span className="text-muted-foreground">
									{" "}
									{t("followingLabel")}
								</span>
							</Link>
						</div>
						<SocialLinks profile={p} />
						{p.bioHtml || p.bio ? (
							<>
								<Separator />
								<div>
									<p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
										{t("profileAbout")}
									</p>
									{p.bioHtml ? (
										<RichBio html={p.bioHtml} />
									) : (
										<p className="whitespace-pre-wrap">{p.bio}</p>
									)}
								</div>
							</>
						) : null}
					</div>
				</div>
			</div>
		</main>
	);
}

function SocialLinks({
	profile,
}: {
	profile: {
		discordName?: string | null;
		telegramName?: string | null;
		furaffinityName?: string | null;
		xName?: string | null;
		twitchName?: string | null;
		blueskyName?: string | null;
	};
}) {
	const t = useTranslations("miscPages");
	const links: { label: string; value: string; href?: string }[] = [];
	if (profile.discordName)
		links.push({ label: "Discord", value: profile.discordName });
	if (profile.telegramName)
		links.push({
			label: "Telegram",
			value: profile.telegramName,
			href: `https://t.me/${profile.telegramName}`,
		});
	if (profile.furaffinityName)
		links.push({
			label: "FA",
			value: profile.furaffinityName,
			href: `https://www.furaffinity.net/user/${profile.furaffinityName}`,
		});
	if (profile.xName)
		links.push({
			label: "X",
			value: profile.xName,
			href: `https://x.com/${profile.xName}`,
		});
	if (profile.twitchName)
		links.push({
			label: "Twitch",
			value: profile.twitchName,
			href: `https://www.twitch.tv/${profile.twitchName}`,
		});
	if (profile.blueskyName)
		links.push({
			label: "Bluesky",
			value: profile.blueskyName,
			href: `https://bsky.app/profile/${profile.blueskyName}`,
		});

	if (links.length === 0) return null;

	const pill =
		"rounded-full bg-primary/15 text-primary border border-transparent px-3 py-1 text-sm transition-colors hover:bg-primary/25";

	return (
		<>
			<Separator />
			<div className="flex gap-2 flex-wrap">
				{links.map((l) =>
					l.href ? (
						<a
							key={l.label}
							href={l.href}
							target="_blank"
							rel="noreferrer noopener"
							className={pill}
						>
							{l.label}: {l.value}
						</a>
					) : (
						<button
							key={l.label}
							type="button"
							className={pill}
							onClick={() => {
								navigator.clipboard.writeText(l.value);
								toast.success(
									t("copiedSocial", { label: l.label, value: l.value }),
								);
							}}
						>
							{l.label}: {l.value}
						</button>
					),
				)}
			</div>
		</>
	);
}

function BirthdayConfetti() {
	useEffect(() => {
		const end = Date.now() + 1500;
		const colors = ["#008055", "#10b981", "#f59e0b", "#ec4899"];
		const frame = () => {
			confetti({
				particleCount: 4,
				angle: 60,
				spread: 55,
				origin: { x: 0 },
				colors,
			});
			confetti({
				particleCount: 4,
				angle: 120,
				spread: 55,
				origin: { x: 1 },
				colors,
			});
			if (Date.now() < end) requestAnimationFrame(frame);
		};
		frame();
	}, []);
	return null;
}

const SELF_FOLLOW_LABEL_KEYS = [
	"selfFollow1",
	"selfFollow2",
	"selfFollow3",
	"selfFollow4",
	"selfFollow5",
	"selfFollow6",
	"selfFollow7",
	"selfFollow8",
];

type FollowStatus = { iFollow: boolean; followsMe: boolean };

function FollowButton({ targetUserId }: { targetUserId: string }) {
	const t = useTranslations("miscPages");
	const { data: session } = useSession();
	const isMe = session?.user?.id === targetUserId;
	const [selfLabelKey] = useState(
		() =>
			SELF_FOLLOW_LABEL_KEYS[
				Math.floor(Math.random() * SELF_FOLLOW_LABEL_KEYS.length)
			],
	);
	const status = useQuery({
		...orpc.follow.status.queryOptions({ input: { targetUserId } }),
		enabled: !isMe,
	});
	const qc = useQueryClient();
	const statusKey = orpc.follow.status.queryKey({ input: { targetUserId } });
	const toggle = useMutation({
		mutationFn: async (next: boolean) => {
			if (next) await client.follow.add({ targetUserId });
			else await client.follow.remove({ targetUserId });
		},
		// Flip the button instantly; roll back if the request fails.
		onMutate: async (next: boolean) => {
			await qc.cancelQueries({ queryKey: statusKey });
			const prev = qc.getQueryData<FollowStatus>(statusKey);
			qc.setQueryData<FollowStatus>(statusKey, (old) =>
				old ? { ...old, iFollow: next } : old,
			);
			return { prev };
		},
		onError: (e: Error, _next, ctx) => {
			if (ctx?.prev) qc.setQueryData(statusKey, ctx.prev);
			toast.error(e.message);
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: statusKey });
			qc.invalidateQueries({ queryKey: orpc.profile.byUrl.key() });
		},
	});

	if (isMe) {
		return (
			<div className="pb-1">
				<Button variant="outline" onClick={() => toast(t("selfFollowToast"))}>
					{t(selfLabelKey)}
				</Button>
			</div>
		);
	}

	if (!status.data) return null;
	return (
		<div className="flex gap-2 pb-1">
			<Button
				variant={status.data.iFollow ? "outline" : "default"}
				className={
					status.data.iFollow
						? undefined
						: "bg-primary text-primary-foreground hover:bg-primary/90"
				}
				disabled={toggle.isPending}
				onClick={() => toggle.mutate(!status.data.iFollow)}
			>
				{status.data.iFollow ? t("following") : t("follow")}
			</Button>
			{status.data.followsMe ? (
				<Badge variant="secondary">{t("followsYou")}</Badge>
			) : null}
		</div>
	);
}
