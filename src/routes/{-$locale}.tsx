import {
	createFileRoute,
	notFound,
	Outlet,
	redirect,
} from "@tanstack/react-router";

// Layout for the optional locale segment. English is unprefixed, so:
//  - no prefix          → fine (English)
//  - /de, /nl           → fine
//  - /en/…              → 301 to the canonical unprefixed path (no duplicate)
//  - anything else      → 404 (a bare first segment was mistaken for a locale)
export const Route = createFileRoute("/{-$locale}")({
	beforeLoad: ({ params, location }) => {
		const locale = (params as { locale?: string }).locale;
		if (!locale) return;
		if (locale === "en") {
			const stripped = location.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
			throw redirect({
				href: `${stripped}${location.searchStr ?? ""}`,
				statusCode: 301,
			});
		}
		if (locale !== "de" && locale !== "nl") {
			throw notFound();
		}
	},
	component: Outlet,
});
