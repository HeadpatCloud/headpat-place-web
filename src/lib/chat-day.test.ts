import { describe, expect, test } from "bun:test";
import { dayKey, dayLabel, daySeparatorIndexes } from "./chat-day";

describe("dayKey", () => {
	test("buckets by calendar day", () => {
		expect(dayKey("2026-08-04T10:00:00Z", "UTC")).toBe("2026-08-04");
		expect(dayKey("2026-08-04T23:59:59Z", "UTC")).toBe("2026-08-04");
		expect(dayKey("2026-08-05T00:00:01Z", "UTC")).toBe("2026-08-05");
	});

	test("uses the viewer's timezone, not UTC", () => {
		// 23:30 UTC is already the next day in Berlin (UTC+2 in August).
		expect(dayKey("2026-08-04T23:30:00Z", "UTC")).toBe("2026-08-04");
		expect(dayKey("2026-08-04T23:30:00Z", "Europe/Berlin")).toBe("2026-08-05");
	});
});

describe("dayLabel", () => {
	test("names today and yesterday, dates everything else", () => {
		expect(dayLabel("2026-08-04", "2026-08-04", "2026-08-03", "x").kind).toBe(
			"today",
		);
		expect(dayLabel("2026-08-03", "2026-08-04", "2026-08-03", "x").kind).toBe(
			"yesterday",
		);
		expect(
			dayLabel("2026-07-30", "2026-08-04", "2026-08-03", "30 July"),
		).toEqual({ kind: "date", at: "30 July" });
	});
});

describe("daySeparatorIndexes", () => {
	test("marks the first message and every day change", () => {
		const items = [
			{ createdAt: "2026-08-02T09:00:00Z" },
			{ createdAt: "2026-08-02T18:00:00Z" },
			{ createdAt: "2026-08-03T08:00:00Z" },
			{ createdAt: "2026-08-04T08:00:00Z" },
			{ createdAt: "2026-08-04T09:00:00Z" },
		];
		expect([...daySeparatorIndexes(items, "UTC").entries()]).toEqual([
			[0, "2026-08-02"],
			[2, "2026-08-03"],
			[3, "2026-08-04"],
		]);
	});

	test("a single day yields exactly one separator", () => {
		const items = [
			{ createdAt: "2026-08-04T09:00:00Z" },
			{ createdAt: "2026-08-04T10:00:00Z" },
		];
		expect(daySeparatorIndexes(items, "UTC").size).toBe(1);
	});

	test("no messages, no separators", () => {
		expect(daySeparatorIndexes([], "UTC").size).toBe(0);
	});
});
