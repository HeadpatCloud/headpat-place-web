import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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

type BadgeCardControls = {
	open: boolean;
	hoverOpen: (e: React.PointerEvent) => void;
	hoverClose: (e: React.PointerEvent) => void;
	toggle: () => void;
	onOpenChange: (next: boolean) => void;
	onEscape: () => void;
	onCloseAutoFocus: (e: Event) => void;
};

// One card open at a time, shared by the whole row, so moving the mouse from
// one badge to the next swaps the card instead of closing both.
function useBadgeCards() {
	const [openId, setOpenId] = useState<string | null>(null);
	// Hover opens it for mice; a click pins it open (and is the only way on touch).
	const pinned = useRef(false);
	const escaped = useRef(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(closeTimer.current), []);
	return (id: string): BadgeCardControls => ({
		open: openId === id,
		hoverOpen(e) {
			if (e.pointerType !== "mouse") return;
			clearTimeout(closeTimer.current);
			if (openId === id) return;
			pinned.current = false;
			setOpenId(id);
		},
		hoverClose(e) {
			if (e.pointerType !== "mouse" || pinned.current) return;
			clearTimeout(closeTimer.current);
			closeTimer.current = setTimeout(
				() => setOpenId((cur) => (cur === id ? null : cur)),
				120,
			);
		},
		toggle() {
			clearTimeout(closeTimer.current);
			if (openId === id && pinned.current) {
				pinned.current = false;
				setOpenId(null);
			} else {
				pinned.current = true;
				setOpenId(id);
			}
		},
		onOpenChange(next) {
			if (next || openId !== id) return;
			pinned.current = false;
			setOpenId(null);
		},
		onEscape() {
			escaped.current = true;
		},
		// Radix moves focus back to the trigger on close. That focus lands
		// outside the card that just opened and would dismiss it, so only do
		// it for Escape, where keyboard users need it.
		onCloseAutoFocus(e) {
			if (!escaped.current) e.preventDefault();
			escaped.current = false;
		},
	});
}

function BadgePill({
	badge,
	card,
}: {
	badge: EarnedBadge;
	card: BadgeCardControls;
}) {
	const t = useTranslations("badges");
	const text = useBadgeText();
	const { icon: Icon, tone } = BADGE_STYLE[badge.id];
	const name = text.name(badge);
	return (
		<Popover open={card.open} onOpenChange={card.onOpenChange}>
			<PopoverTrigger
				type="button"
				aria-label={name}
				onPointerEnter={card.hoverOpen}
				onPointerLeave={card.hoverClose}
				onClick={(e) => {
					e.preventDefault();
					card.toggle();
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
				onPointerEnter={card.hoverOpen}
				onPointerLeave={card.hoverClose}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onEscapeKeyDown={card.onEscape}
				onCloseAutoFocus={card.onCloseAutoFocus}
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
	const cardFor = useBadgeCards();
	if (badges.length === 0) return null;
	return (
		<div className={cn("flex flex-wrap gap-1.5", className)}>
			{badges.map((b) => (
				<BadgePill key={b.id} badge={b} card={cardFor(b.id)} />
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
