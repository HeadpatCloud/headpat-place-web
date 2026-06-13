/**
 * Lightweight i18n stub. Drop-in replacement for `gt-next` while we wait on a
 * full TanStack-compatible i18n library. Returns the key passed in OR a value
 * from the dictionary if present. Lets us port pages without rewriting every
 * label call site; replace with real i18n later by swapping this file.
 */

// Centralised string dictionary keyed by `namespace.key`. Add entries as you
// port pages; missing keys fall back to a humanised key.
const DICT: Record<string, string> = {
	// Sidebar nav
	"PageNames.home": "Home",
	"PageNames.gallery": "Gallery",
	"PageNames.announcements": "Announcements",
	"PageNames.notifications": "Notifications",
	"PageNames.events": "Events",
	"PageNames.map": "Map",
	"PageNames.users": "Discover users",
	"PageNames.myprofile": "My profile",
	"PageNames.communities": "Communities",
	"PageNames.legal": "Legal",
	"PageNames.changelog": "Changelog",
	"MainMetadata.title": "Headpat",
	"MainMetadata.description":
		"Headpat.place — a social media platform for the next generation.",

	// Login zod messages
	"Zod.Login.MinUsernameLength": "Username must be at least 3 characters",
	"Zod.Login.MinPasswordLength": "Password must be at least 8 characters",
	"Zod.Login.MaxPasswordLength": "Password must be at most 256 characters",
	"Zod.Login.InvalidEmail": "Invalid email",
	"Zod.Login.AcceptedTerms": "You must accept the terms",
};

function humanise(key: string): string {
	const last = key.split(".").pop() ?? key;
	return last.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function useTranslations(namespace: string) {
	return (key: string): string => {
		const full = `${namespace}.${key}`;
		return DICT[full] ?? humanise(key);
	};
}

export function useLocale(): string {
	return "en";
}

export type TFunction = ReturnType<typeof useTranslations>;
