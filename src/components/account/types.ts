export type NotificationPrefs = {
	follows: boolean;
	messages: boolean;
	replies: boolean;
	announcements: boolean;
};

export type AccountProfile = {
	userId: string;
	name?: string | null;
	profileUrl: string;
	displayName?: string | null;
	status?: string | null;
	bio?: string | null;
	pronouns?: string | null;
	birthday?: string | Date | null;
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
