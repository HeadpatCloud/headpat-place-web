import { Panel, ToggleRow } from "./Section";
import type { AccountProfile, NotificationPrefs } from "./types";

type Patch = {
	emailNotifications?: boolean;
	notificationPrefs?: Partial<NotificationPrefs>;
};

type Props = {
	profile: AccountProfile;
	onUpdate: (patch: Patch) => void;
};

const TYPES: {
	key: keyof NotificationPrefs;
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
		title: "Replies & reactions",
		description: "Replies and reactions to your posts.",
	},
	{
		key: "announcements",
		title: "Announcements",
		description: "Product news and platform updates.",
	},
];

export function NotificationsSection({ profile, onUpdate }: Props) {
	const emailOn = profile.emailNotifications;
	const prefs: NotificationPrefs = {
		follows: true,
		messages: true,
		replies: true,
		announcements: true,
		...(profile.notificationPrefs ?? {}),
	};

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
			<Panel className="divide-y divide-border px-5">
				{TYPES.map((t) => (
					<ToggleRow
						key={t.key}
						title={t.title}
						description={t.description}
						checked={emailOn && prefs[t.key]}
						disabled={!emailOn}
						onChange={(v) => onUpdate({ notificationPrefs: { [t.key]: v } })}
					/>
				))}
			</Panel>
		</div>
	);
}
