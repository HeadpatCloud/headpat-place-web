import type { BadgeId, ManualBadgeId } from "@backend/lib/badges";
import {
	CrownIcon,
	FlaskConicalIcon,
	HeartIcon,
	type LucideIcon,
	MegaphoneIcon,
	ShieldCheckIcon,
	SparklesIcon,
	TicketIcon,
} from "lucide-react";

export type { BadgeId, EarnedBadge, ManualBadgeId } from "@backend/lib/badges";

// Type-only link to the API: a Record keeps this list in step with it.
const MANUAL: Record<ManualBadgeId, true> = {
	supporter: true,
	betaTester: true,
};
export const MANUAL_BADGES = Object.keys(MANUAL) as ManualBadgeId[];

// Soft tinted pills; each badge keeps one hue so it reads the same everywhere.
export const BADGE_STYLE: Record<BadgeId, { icon: LucideIcon; tone: string }> =
	{
		staff: {
			icon: ShieldCheckIcon,
			tone: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
		},
		communityFounder: {
			icon: CrownIcon,
			tone: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
		},
		eventHost: {
			icon: MegaphoneIcon,
			tone: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
		},
		eventGoer: {
			icon: TicketIcon,
			tone: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
		},
		earlyMember: {
			icon: SparklesIcon,
			tone: "bg-fuchsia-500/15 text-fuchsia-700 ring-fuchsia-500/30 dark:text-fuchsia-300",
		},
		supporter: {
			icon: HeartIcon,
			tone: "bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300",
		},
		betaTester: {
			icon: FlaskConicalIcon,
			tone: "bg-teal-500/15 text-teal-700 ring-teal-500/30 dark:text-teal-300",
		},
	};
