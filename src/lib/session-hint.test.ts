import { describe, expect, test } from "bun:test";
import { hintCookie, parseHint } from "./session-hint";

describe("session hint cookie", () => {
	test("round-trips a hint", () => {
		const cookie = hintCookie({ n: "Faye", a: "file1" }).split(";")[0];
		expect(parseHint(`theme=dark; ${cookie}`)).toEqual({
			n: "Faye",
			a: "file1",
		});
	});

	test("ignores a missing or malformed cookie", () => {
		expect(parseHint(undefined)).toBeNull();
		expect(parseHint("theme=dark")).toBeNull();
		expect(parseHint("hp_hint=%7Bnope")).toBeNull();
		expect(parseHint("hp_hint=%7B%22a%22%3A1%7D")).toBeNull();
	});

	test("clearing expires the cookie", () => {
		expect(hintCookie(null)).toContain("Max-Age=0");
	});
});
