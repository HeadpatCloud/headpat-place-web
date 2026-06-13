import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { useSession } from "@/lib/auth-client";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_app/user/$profileUrl/")({
	component: UserProfilePage,
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
	const profile = useQuery(
		orpc.profile.byUrl.queryOptions({ input: { profileUrl } }),
	);
	const avatarUrl = useStorageUrl("avatar", profile.data?.avatarFileId, "md");

	if (profile.isPending)
		return <p className="p-4 text-muted-foreground">Loading…</p>;
	if (profile.isError || !profile.data)
		return <p className="p-4">Profile not found.</p>;
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
								<span className="font-semibold">It's my birthday today!</span>
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
								<span className="text-muted-foreground"> followers</span>
							</Link>
							<Link
								to={`/user/${profileUrl}/following` as never}
								className="hover:underline"
							>
								<span className="font-medium">{p.followingCount}</span>
								<span className="text-muted-foreground"> following</span>
							</Link>
						</div>
						<SocialLinks profile={p} />
						{p.bioHtml || p.bio ? (
							<>
								<Separator />
								<div>
									<p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
										About
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
								toast.success(`Copied ${l.label}: ${l.value}`);
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

const SELF_FOLLOW_LABELS = [
	"It me 🪞",
	"That's you, genius",
	"Self-follow? bold",
	"#1 fan: yourself",
	"Looking good today ✨",
	"Go touch grass",
	"Certified you",
	"Mirror says hi",
];

function FollowButton({ targetUserId }: { targetUserId: string }) {
	const { data: session } = useSession();
	const isMe = session?.user?.id === targetUserId;
	const [selfLabel] = useState(
		() =>
			SELF_FOLLOW_LABELS[Math.floor(Math.random() * SELF_FOLLOW_LABELS.length)],
	);
	const status = useQuery({
		...orpc.follow.status.queryOptions({ input: { targetUserId } }),
		enabled: !isMe,
	});

	if (isMe) {
		return (
			<div className="pb-1">
				<Button
					variant="outline"
					onClick={() =>
						toast("You can't follow yourself — but the confidence is noted.")
					}
				>
					{selfLabel}
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
			>
				{status.data.iFollow ? "Following" : "Follow"}
			</Button>
			{status.data.followsMe ? (
				<Badge variant="secondary">Follows you</Badge>
			) : null}
		</div>
	);
}
