export const THEME_TOKEN_GROUPS = [
	{
		label: "Base",
		tokens: [
			{ key: "background", label: "Background" },
			{ key: "foreground", label: "Foreground" },
		],
	},
	{
		label: "Surfaces",
		tokens: [
			{ key: "card", label: "Card" },
			{ key: "card-foreground", label: "Card text" },
			{ key: "popover", label: "Popover" },
			{ key: "popover-foreground", label: "Popover text" },
			{ key: "muted", label: "Muted" },
			{ key: "muted-foreground", label: "Muted text" },
		],
	},
	{
		label: "Brand",
		tokens: [
			{ key: "primary", label: "Primary" },
			{ key: "primary-foreground", label: "Primary text" },
			{ key: "secondary", label: "Secondary" },
			{ key: "secondary-foreground", label: "Secondary text" },
			{ key: "accent", label: "Accent" },
			{ key: "accent-foreground", label: "Accent text" },
		],
	},
	{
		label: "Semantic",
		tokens: [
			{ key: "border", label: "Border" },
			{ key: "input", label: "Input" },
			{ key: "ring", label: "Ring" },
			{ key: "destructive", label: "Destructive" },
			{ key: "destructive-foreground", label: "Destructive text" },
		],
	},
	{
		label: "Sidebar",
		tokens: [
			{ key: "sidebar", label: "Sidebar" },
			{ key: "sidebar-foreground", label: "Sidebar text" },
			{ key: "sidebar-border", label: "Sidebar border" },
		],
	},
] as const;

export const THEME_TOKEN_KEYS = THEME_TOKEN_GROUPS.flatMap((g) =>
	g.tokens.map((t) => t.key),
);

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
export type ThemeTokens = Record<ThemeTokenKey, string>;

export const CONTRAST_PAIRS: [ThemeTokenKey, ThemeTokenKey][] = [
	["background", "foreground"],
	["card", "card-foreground"],
	["popover", "popover-foreground"],
	["muted", "muted-foreground"],
	["primary", "primary-foreground"],
];
