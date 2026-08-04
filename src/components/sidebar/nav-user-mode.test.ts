import { describe, expect, test } from "bun:test";
import { navUserMode } from "./nav-user-mode";

describe("navUserMode", () => {
	test("signed-in shows the account dropdown", () => {
		expect(navUserMode({ isPending: false, signedIn: true })).toBe("signed-in");
	});

	test("signed-out gets no dropdown", () => {
		expect(navUserMode({ isPending: false, signedIn: false })).toBe(
			"signed-out",
		);
	});

	test("still pending is loading, not signed-out", () => {
		expect(navUserMode({ isPending: true, signedIn: false })).toBe("loading");
	});

	test("pending outranks a session that has already arrived", () => {
		expect(navUserMode({ isPending: true, signedIn: true })).toBe("loading");
	});
});
