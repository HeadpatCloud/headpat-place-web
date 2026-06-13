import { Switch } from "@/components/ui/switch";
import { Panel, ToggleRow } from "./Section";
import type {
	AccountProfile,
	ChannelPrefs,
	NotificationCategory,
	NotificationPrefs,
} from "./types";

type Patch = {
	emailNotifications?: boolean;
	notificationPrefs?: Partial<
		Record<NotificationCategory, Partial<ChannelPrefs>>
	>;
};

type Props = {
	profile: AccountProfile;
	onUpdate: (patch: Patch) => void;
};

// Mirror of DEFAULT_NOTIFICATION_PREFS in headpat-place-api — keep in sync.
const DEFAULTS: NotificationPrefs = {
	follows: { email: false, push: true },
	messages: { email: true, push: true },
	replies: { email: true, push: true },
	events: { email: true, push: true },
};

const CATEGORIES: {
	key: NotificationCategory;
	title: string;
	description: string;
}[] = [
	{
		key: "follows",
		title: "New followers",
		description: "When someone follows you.",
	},
	{
		key: "messages",
		title: "Direct messages",
		description: "When you get a new message.",
	},
	{
		key: "replies",
		title: "Replies & comments",
		description: "Comments on your gallery and ticket replies.",
	},
	{
		key: "events",
		title: "Event reminders",
		description: "Before an event you're attending starts.",
	},
];

// Tolerate a legacy boolean or partial value, falling back to the default.
function channel(raw: unknown, fallback: ChannelPrefs): ChannelPrefs {
	if (typeof raw === "boolean") return { email: raw, push: raw };
	if (raw && typeof raw === "object") {
		const r = raw as Partial<ChannelPrefs>;
		return {
			email: typeof r.email === "boolean" ? r.email : fallback.email,
			push: typeof r.push === "boolean" ? r.push : fallback.push,
		};
	}
	return fallback;
}

export function NotificationsSection({ profile, onUpdate }: Props) {
	const emailOn = profile.emailNotifications;
	const stored = (profile.notificationPrefs ?? {}) as Record<string, unknown>;

	return (
		<div className="space-y-4">
			<Panel className="px-5">
				<ToggleRow
					title="Email notifications"
					description="The master switch — turn this off to stop all emails."
					checked={emailOn}
					onChange={(v) => onUpdate({ emailNotifications: v })}
				/>
			</Panel>

			<Panel className="px-5">
				<div className="flex items-center gap-3 border-b border-border py-2.5">
					<div className="flex-1" />
					<div className="w-14 text-center text-xs font-semibold text-muted-foreground">
						Email
					</div>
					<div className="w-14 text-center text-xs font-semibold text-muted-foreground">
						Push
					</div>
				</div>

				{CATEGORIES.map((c) => {
					const prefs = channel(stored[c.key], DEFAULTS[c.key]);
					return (
						<div
							key={c.key}
							className="flex items-center gap-3 border-b border-border py-3.5 last:border-0"
						>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">{c.title}</p>
								<p className="text-xs text-muted-foreground">{c.description}</p>
							</div>
							<div className="flex w-14 justify-center">
								<Switch
									aria-label={`${c.title} email`}
									checked={emailOn && prefs.email}
									disabled={!emailOn}
									onCheckedChange={(v) =>
										onUpdate({ notificationPrefs: { [c.key]: { email: v } } })
									}
								/>
							</div>
							<div className="flex w-14 justify-center">
								<Switch
									aria-label={`${c.title} push`}
									checked={prefs.push}
									onCheckedChange={(v) =>
										onUpdate({ notificationPrefs: { [c.key]: { push: v } } })
									}
								/>
							</div>
						</div>
					);
				})}

				<p className="pt-3 text-xs text-muted-foreground">
					Push notifications are delivered to the Headpat mobile app. In-app
					notifications always appear in your notification bell.
				</p>
			</Panel>
		</div>
	);
}
