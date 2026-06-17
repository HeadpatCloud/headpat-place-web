import { describe, expect, test } from "bun:test";
import {
	buildAllReactors,
	type ReactorGroup,
	shouldShowAllTab,
	summarizeNames,
} from "./reactor-summary";

function user(id: string, name: string) {
	return {
		userId: id,
		displayName: name,
		name,
		avatarFileId: null,
		profileUrl: null,
	};
}

describe("summarizeNames", () => {
	test("shows first maxShown names and counts the rest from total", () => {
		const result = summarizeNames(["Alice", "Bob", "Charlie", "Dave"], 7);
		expect(result.shown).toEqual(["Alice", "Bob", "Charlie"]);
		expect(result.moreCount).toBe(4);
	});

	test("no more when total equals shown at the boundary", () => {
		const result = summarizeNames(["Alice", "Bob", "Charlie"], 3);
		expect(result.shown).toEqual(["Alice", "Bob", "Charlie"]);
		expect(result.moreCount).toBe(0);
	});

	test("respects a custom maxShown", () => {
		const result = summarizeNames(["Alice", "Bob", "Charlie"], 5, 1);
		expect(result.shown).toEqual(["Alice"]);
		expect(result.moreCount).toBe(4);
	});

	test("clamps moreCount at zero when total is smaller than names", () => {
		const result = summarizeNames(["Alice", "Bob"], 1);
		expect(result.shown).toEqual(["Alice", "Bob"]);
		expect(result.moreCount).toBe(0);
	});
});

describe("shouldShowAllTab", () => {
	test("true when distinct reactors is exactly 100", () => {
		expect(shouldShowAllTab(100)).toBe(true);
	});

	test("false when distinct reactors exceeds 100", () => {
		expect(shouldShowAllTab(101)).toBe(false);
	});
});

describe("buildAllReactors", () => {
	test("aggregates emojis per reactor in first-appearance order", () => {
		const groups: ReactorGroup[] = [
			{ emoji: "👍", count: 2, users: [user("a", "Alice"), user("b", "Bob")] },
			{
				emoji: "🔥",
				count: 2,
				users: [user("c", "Charlie"), user("a", "Alice")],
			},
		];
		const result = buildAllReactors(groups);
		expect(result.map((r) => r.user.userId)).toEqual(["a", "b", "c"]);
		expect(result[0].emojis).toEqual(["👍", "🔥"]);
		expect(result[1].emojis).toEqual(["👍"]);
		expect(result[2].emojis).toEqual(["🔥"]);
	});
});
