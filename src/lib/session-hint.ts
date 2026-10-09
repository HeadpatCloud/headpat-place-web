export type SessionHint = { n: string; a: string | null };

export const HINT_COOKIE = "hp_hint";

export function parseHint(
	cookieHeader: string | undefined,
): SessionHint | null {
	if (!cookieHeader) return null;
	const part = cookieHeader
		.split(";")
		.map((c) => c.trim())
		.find((c) => c.startsWith(`${HINT_COOKIE}=`));
	if (!part) return null;
	try {
		const v = JSON.parse(
			decodeURIComponent(part.slice(HINT_COOKIE.length + 1)),
		);
		if (typeof v?.n !== "string") return null;
		return { n: v.n.slice(0, 80), a: typeof v.a === "string" ? v.a : null };
	} catch {
		return null;
	}
}

export function hintCookie(hint: SessionHint | null): string {
	if (!hint) return `${HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
	return `${HINT_COOKIE}=${encodeURIComponent(JSON.stringify(hint))}; Path=/; Max-Age=2592000; SameSite=Lax`;
}
