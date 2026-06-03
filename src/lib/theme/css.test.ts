import { describe, expect, test } from "bun:test";
import { themeCss } from "./css";
import { THEME_TOKEN_KEYS, type ThemeTokens } from "./tokens";

const t = Object.fromEntries(
	THEME_TOKEN_KEYS.map((k) => [k, "#123456"]),
) as ThemeTokens;

describe("themeCss", () => {
	test("emits a base block and a .dark block with all tokens", () => {
		const css = themeCss('[data-theme="custom-x"]', t, t);
		expect(css).toContain('[data-theme="custom-x"]{');
		expect(css).toContain('[data-theme="custom-x"].dark{');
		expect(css).toContain("--background:#123456;");
		expect(css).toContain("--sidebar-border:#123456;");
		expect(css.match(/--/g)?.length).toBe(THEME_TOKEN_KEYS.length * 2);
	});
});
