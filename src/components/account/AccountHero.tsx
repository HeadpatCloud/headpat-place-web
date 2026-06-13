import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { GradientBanner } from "@/components/GradientBanner";
import { useStorageUrl } from "@/components/StorageImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orpc } from "@/lib/orpc";
import { MediaEditOverlay } from "./MediaEditOverlay";
import type { AccountProfile } from "./types";

type Props = {
	profile: AccountProfile;
	onChangeMedia: (
		field: "avatarFileId" | "bannerFileId",
		fileId: string | null,
	) => Promise<unknown>;
};

export function AccountHero({ profile, onChangeMedia }: Props) {
	const avatarUrl = useStorageUrl("avatar", profile.avatarFileId, "md");
	const uploads = useQuery({
		...orpc.gallery.list.queryOptions({
			input: { userId: profile.userId, pageSize: 1 },
		}),
	});

	const name = profile.displayName || profile.name || profile.profileUrl;
	const publicPath = `/user/${profile.profileUrl}`;

	function copyLink() {
		const url = `${window.location.origin}${publicPath}`;
		navigator.clipboard.writeText(url);
		toast.success("Profile link copied.");
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-border bg-card">
			<MediaEditOverlay
				kind="banner"
				currentFileId={profile.bannerFileId}
				onChange={(id) => onChangeMedia("bannerFileId", id)}
				label="Change banner"
				className="block"
			>
				<GradientBanner
					kind="banner"
					fileId={profile.bannerFileId}
					aspect="3/1"
				/>
			</MediaEditOverlay>

			<div className="px-6 pb-6">
				<div className="-mt-12 flex flex-wrap items-end gap-4">
					<MediaEditOverlay
						kind="avatar"
						currentFileId={profile.avatarFileId}
						onChange={(id) => onChangeMedia("avatarFileId", id)}
						label="Change avatar"
						className="size-28 rounded-2xl border border-border ring-4 ring-background"
					>
						<Avatar className="size-full rounded-2xl">
							<AvatarImage
								src={avatarUrl.data?.url}
								alt={name}
								className="rounded-2xl"
							/>
							<AvatarFallback className="rounded-2xl text-3xl">
								{name.charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</MediaEditOverlay>

					<div className="min-w-0 flex-1 pb-1">
						<h1 className="truncate text-xl font-extrabold tracking-tight">
							{name}
						</h1>
						<p className="truncate text-sm text-muted-foreground">
							@{profile.profileUrl}
						</p>
					</div>

					<div className="flex gap-2 pb-1">
						<Button variant="outline" size="sm" onClick={copyLink}>
							<Copy className="size-4" /> Copy link
						</Button>
						<Button asChild size="sm">
							<Link to={publicPath as never}>
								<ExternalLink className="size-4" /> View profile
							</Link>
						</Button>
					</div>
				</div>

				<div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
					{profile.createdAt ? (
						<span className="text-muted-foreground">
							Member since{" "}
							<span className="font-medium text-foreground">
								{format(new Date(profile.createdAt), "MMMM yyyy")}
							</span>
						</span>
					) : null}
					<span className="text-muted-foreground">
						<span className="font-medium text-foreground">
							{uploads.data?.total ?? 0}
						</span>{" "}
						uploads
					</span>
					<Link
						to={`${publicPath}/followers` as never}
						className="text-muted-foreground hover:text-foreground"
					>
						<span className="font-medium text-foreground">
							{profile.followersCount}
						</span>{" "}
						followers
					</Link>
					<Link
						to={`${publicPath}/following` as never}
						className="text-muted-foreground hover:text-foreground"
					>
						<span className="font-medium text-foreground">
							{profile.followingCount}
						</span>{" "}
						following
					</Link>
				</div>

				{(profile.badges ?? []).length > 0 ? (
					<div className="mt-3 flex flex-wrap gap-2">
						{(profile.badges ?? []).map((b) => (
							<Badge key={b}>{b}</Badge>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}
