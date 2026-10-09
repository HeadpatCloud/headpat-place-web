import { describe, expect, test } from "bun:test";
import { eventJsonLd } from "./event-seo";

const base = {
	title: "Meetup",
	startsAt: "2030-05-01T18:00:00Z",
	locationZoneMethod: "circle",
	locationText: "Berlin",
};
const url = "https://headpat.place/events/e1";

describe("eventJsonLd", () => {
	test("physical events get a Place and offline attendance", () => {
		const j = eventJsonLd(base, url);
		expect(j?.eventAttendanceMode).toBe(
			"https://schema.org/OfflineEventAttendanceMode",
		);
		expect(j?.location).toEqual({
			"@type": "Place",
			name: "Berlin",
			address: "Berlin",
		});
	});

	test("virtual events point at the website, falling back to the event page", () => {
		const v = { ...base, locationZoneMethod: "virtual", locationText: null };
		expect(eventJsonLd(v, url)?.location).toEqual({
			"@type": "VirtualLocation",
			url,
		});
		expect(
			eventJsonLd({ ...v, website: "https://x.test/live" }, url)?.location,
		).toEqual({ "@type": "VirtualLocation", url: "https://x.test/live" });
	});

	test("normalises dates to ISO and omits a missing end", () => {
		const j = eventJsonLd(
			{ ...base, startsAt: new Date("2030-05-01T18:00:00Z") },
			url,
		);
		expect(j?.startDate).toBe("2030-05-01T18:00:00.000Z");
		expect("endDate" in (j ?? {})).toBe(false);
		expect(
			eventJsonLd({ ...base, endsAt: "2030-05-01T20:00:00Z" }, url)?.endDate,
		).toBe("2030-05-01T20:00:00.000Z");
	});

	test("returns null without a valid start date", () => {
		expect(eventJsonLd({ ...base, startsAt: "garbage" }, url)).toBeNull();
	});

	test("free vs paid", () => {
		expect(eventJsonLd(base, url)?.isAccessibleForFree).toBe(true);
		expect(
			eventJsonLd({ ...base, isPaid: true }, url)?.isAccessibleForFree,
		).toBe(false);
	});

	test("caps the description", () => {
		const j = eventJsonLd({ ...base, description: "a ".repeat(600) }, url);
		expect(j?.description?.length).toBeLessThanOrEqual(500);
	});
});
