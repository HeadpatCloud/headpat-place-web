export type ChannelPrefs = { email: boolean; push: boolean };

export type NotificationCategory =
	| "follows"
	| "messages"
	| "replies"
	| "events";

export type NotificationPrefs = Record<NotificationCategory, ChannelPrefs>;

export type AccountProfile = {
	userId: string;
	name?: string | null;
	profileUrl: string;
	displayName?: string | null;
	status?: string | null;
	bio?: string | null;
	bioHtml?: string | null;
	pronouns?: string | null;
	birthday?: string | Date | null;
	birthdayVisible?: boolean;
	birthdayShowDay?: boolean;
	birthdayShowYear?: boolean;
	location?: string | null;
	timezone?: string | null;
	discordName?: string | null;
	telegramName?: string | null;
	furaffinityName?: string | null;
	xName?: string | null;
	twitchName?: string | null;
	blueskyName?: string | null;
	avatarFileId?: string | null;
	bannerFileId?: string | null;
	followersCount: number;
	followingCount: number;
	badges?: string[] | null;
	indexingEnabled: boolean;
	nsfwEnabled: boolean;
	emailNotifications: boolean;
	notificationPrefs?: NotificationPrefs | null;
	createdAt?: string | Date | null;
};
