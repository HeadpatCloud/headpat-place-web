export type SocialProfile = {
	discordName?: string | null;
	telegramName?: string | null;
	furaffinityName?: string | null;
	xName?: string | null;
	twitchName?: string | null;
	blueskyName?: string | null;
};

export type SocialLink = { label: string; value: string; href?: string };

const SITES: {
	key: keyof SocialProfile;
	label: string;
	url?: (name: string) => string;
}[] = [
	{ key: "discordName", label: "Discord" },
	{
		key: "telegramName",
		label: "Telegram",
		url: (n) => `https://t.me/${n}`,
	},
	{
		key: "furaffinityName",
		label: "FA",
		url: (n) => `https://www.furaffinity.net/user/${n}`,
	},
	{ key: "xName", label: "X", url: (n) => `https://x.com/${n}` },
	{
		key: "twitchName",
		label: "Twitch",
		url: (n) => `https://www.twitch.tv/${n}`,
	},
	{
		key: "blueskyName",
		label: "Bluesky",
		url: (n) => `https://bsky.app/profile/${n}`,
	},
];

export function socialLinks(profile: SocialProfile): SocialLink[] {
	return SITES.flatMap((site) => {
		const value = profile[site.key];
		if (!value) return [];
		return [
			{
				label: site.label,
				value,
				href: site.url?.(encodeURIComponent(value)),
			},
		];
	});
}
