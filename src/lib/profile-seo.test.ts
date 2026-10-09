import { describe, expect, test } from "bun:test";
import { profileJsonLd } from "./profile-seo";
import { socialLinks } from "./social";

const base = {
	url: "https://headpat.place/user/mia",
	name: "Mia",
	handle: "mia",
};

describe("socialLinks", () => {
	test("builds profile urls and keeps discord as copy-only", () => {
		const links = socialLinks({
			discordName: "mia#1",
			xName: "mia_x",
			telegramName: "miat",
		});
		expect(links.find((l) => l.label === "Discord")?.href).toBeUndefined();
		expect(links.find((l) => l.label === "X")?.href).toBe(
			"https://x.com/mia_x",
		);
		expect(links.find((l) => l.label === "Telegram")?.href).toBe(
			"https://t.me/miat",
		);
	});

	test("skips empty and null names", () => {
		expect(socialLinks({ xName: "", twitchName: null })).toEqual([]);
	});

	test("encodes names so they can't break out of the url", () => {
		const [l] = socialLinks({ blueskyName: "a b/c?d" });
		expect(l?.href).toBe("https://bsky.app/profile/a%20b%2Fc%3Fd");
	});
});

describe("profileJsonLd", () => {
	test("is a ProfilePage with a Person entity", () => {
		const j = profileJsonLd({ ...base, social: {} });
		expect(j["@type"]).toBe("ProfilePage");
		expect(j.mainEntity["@type"]).toBe("Person");
		expect(j.mainEntity.alternateName).toBe("@mia");
	});

	test("only includes sameAs when there are linkable profiles", () => {
		expect(
			"sameAs" in
				profileJsonLd({ ...base, social: { discordName: "x" } }).mainEntity,
		).toBe(false);
		expect(
			profileJsonLd({ ...base, social: { xName: "mia" } }).mainEntity.sameAs,
		).toEqual(["https://x.com/mia"]);
	});

	test("trims and caps the bio and drops it when empty", () => {
		const long = "word ".repeat(200);
		expect(
			profileJsonLd({ ...base, bio: long, social: {} }).mainEntity.description
				?.length,
		).toBeLessThanOrEqual(300);
		expect(
			"description" in
				profileJsonLd({ ...base, bio: "  \n ", social: {} }).mainEntity,
		).toBe(false);
	});

	test("ignores an unparseable join date", () => {
		expect(
			"dateCreated" in
				profileJsonLd({ ...base, createdAt: "nope", social: {} }),
		).toBe(false);
		expect(
			profileJsonLd({ ...base, createdAt: "2026-01-02T03:04:05Z", social: {} })
				.dateCreated,
		).toBe("2026-01-02T03:04:05.000Z");
	});
});
