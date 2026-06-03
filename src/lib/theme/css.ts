import { THEME_TOKEN_KEYS, type ThemeTokens } from "./tokens";

function vars(tokens: ThemeTokens): string {
	return THEME_TOKEN_KEYS.map((k) => `--${k}:${tokens[k]};`).join("");
}

export function themeCss(
	selector: string,
	light: ThemeTokens,
	dark: ThemeTokens,
): string {
	return `${selector}{${vars(light)}}${selector}.dark{${vars(dark)}}`;
}
