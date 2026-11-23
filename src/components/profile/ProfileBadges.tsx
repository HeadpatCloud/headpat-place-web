import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { StorageImage } from "@/components/StorageImage";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { BADGE_STYLE, type EarnedBadge } from "@/lib/badges";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

export function useBadgeText() {
	const t = useTranslations("badges");
	return {
		name(b: EarnedBadge) {
			if (b.id === "eventGoer") return t(`eventGoer.name.${b.level ?? 1}`);
			return t(`${b.id}.name`);
		},
		description(b: EarnedBadge) {
			if (b.count !== undefined)
				return t(`${b.id}.description`, { count: b.count });
			return t(`${b.id}.description`);
		},
	};
}

function BadgePill({ badge }: { badge: EarnedBadge }) {
	const t = useTranslations("badges");
	const text = useBadgeText();
	const { icon: Icon, tone } = BADGE_STYLE[badge.id];
	const [open, setOpen] = useState(false);
	// Hover opens it for mice; a click pins it open (and is the only way on touch).
	const pinned = useRef(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const hoverOpen = (e: React.PointerEvent) => {
		if (e.pointerType !== "mouse") return;
		clearTimeout(closeTimer.current);
		setOpen(true);
	};
	const hoverClose = (e: React.PointerEvent) => {
		if (e.pointerType !== "mouse" || pinned.current) return;
		closeTimer.current = setTimeout(() => setOpen(false), 120);
	};
	const name = text.name(badge);
	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				if (!next) pinned.current = false;
				setOpen(next);
			}}
		>
			<PopoverTrigger
				type="button"
				aria-label={name}
				onPointerEnter={hoverOpen}
				onPointerLeave={hoverClose}
				onClick={(e) => {
					e.preventDefault();
					pinned.current = !pinned.current || !open;
					setOpen(pinned.current);
				}}
				className={cn(
					"inline-flex size-8 items-center justify-center rounded-full ring-1 ring-inset transition-[scale] hover:scale-110 focus-visible:outline-hidden focus-visible:ring-2",
					tone,
				)}
			>
				<Icon className="size-4" aria-hidden />
			</PopoverTrigger>
			<PopoverContent
				className="w-64 space-y-2 rounded-xl p-3"
				align="start"
				onPointerEnter={hoverOpen}
				onPointerLeave={hoverClose}
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"flex size-8 items-center justify-center rounded-full ring-1 ring-inset",
							tone,
						)}
					>
						<Icon className="size-4" aria-hidden />
					</span>
					<div className="min-w-0">
						<p className="truncate font-semibold">{name}</p>
						{badge.level ? (
							<p className="text-xs text-muted-foreground">
								{t("eventGoer.level", { level: badge.level })}
							</p>
						) : null}
					</div>
				</div>
				<p className="text-sm">{text.description(badge)}</p>
				{badge.next !== undefined && badge.count !== undefined ? (
					<p className="text-xs text-muted-foreground">
						{t("eventGoer.next", { count: badge.next - badge.count })}
					</p>
				) : null}
				{badge.communities?.length ? (
					<ul className="space-y-1 text-sm">
						{badge.communities.map((c) => (
							<li key={c.id}>
								<Link
									to={`/community/${c.id}` as never}
									className="flex items-center gap-2 rounded-lg p-1 -mx-1 font-medium transition-colors hover:bg-muted"
								>
									<StorageImage
										kind="community-avatar"
										fileId={c.avatarFileId}
										variant="sm"
										className="size-7 shrink-0 rounded-lg bg-muted object-cover"
										fallback={
											<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-xs font-semibold text-primary-foreground">
												{c.name.charAt(0).toUpperCase()}
											</span>
										}
									/>
									<span className="truncate text-link">{c.name}</span>
								</Link>
							</li>
						))}
						{badge.count !== undefined &&
						badge.count > badge.communities.length ? (
							<li className="text-xs text-muted-foreground">
								{t("communityFounder.more", {
									count: badge.count - badge.communities.length,
								})}
							</li>
						) : null}
					</ul>
				) : null}
			</PopoverContent>
		</Popover>
	);
}

export function BadgeList({
	badges,
	className,
}: {
	badges: EarnedBadge[];
	className?: string;
}) {
	if (badges.length === 0) return null;
	return (
		<div className={cn("flex flex-wrap gap-1.5", className)}>
			{badges.map((b) => (
				<BadgePill key={b.id} badge={b} />
			))}
		</div>
	);
}

export function ProfileBadges({
	userId,
	className,
}: {
	userId: string | null | undefined;
	className?: string;
}) {
	const badges = useQuery({
		...orpc.profile.badges.queryOptions({ input: { userId: userId ?? "" } }),
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
	});
	return <BadgeList badges={badges.data ?? []} className={className} />;
}
