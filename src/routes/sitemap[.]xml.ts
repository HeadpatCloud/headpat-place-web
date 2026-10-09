import { createFileRoute } from "@tanstack/react-router";
import { LOCALES } from "@/lib/i18n";
import { BACKEND_URL } from "@/lib/orpc";
import { localeUrl } from "@/lib/seo";

const STATIC_PATHS = [
	"/",
	"/support",
	"/events",
	"/community",
	"/map",
	"/changelog",
	"/legal",
	"/legal/eula",
	"/legal/privacypolicy",
	"/legal/impressum",
	"/legal/termsofservice",
	"/legal/acceptableuse",
	"/legal/disclaimer",
];

type Entry = { path: string; updatedAt?: string };

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function urlBlock({ path, updatedAt }: Entry): string {
	const alternates = LOCALES.map(
		(l) =>
			`<xhtml:link rel="alternate" hreflang="${l.code}" href="${escapeXml(localeUrl(path, l.code))}"/>`,
	);
	alternates.push(
		`<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localeUrl(path, "en"))}"/>`,
	);
	return `<url><loc>${escapeXml(localeUrl(path, "en"))}</loc>${
		updatedAt ? `<lastmod>${new Date(updatedAt).toISOString()}</lastmod>` : ""
	}${alternates.join("")}</url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const res = await fetch(`${BACKEND_URL}/api/sitemap`);
				if (!res.ok) {
					return new Response(`sitemap source failed: ${res.status}`, {
						status: 502,
					});
				}
				const data = (await res.json()) as {
					communities: { id: string; updatedAt: string }[];
					events: { id: string; updatedAt: string }[];
					profiles: { profileUrl: string; updatedAt: string }[];
				};
				const entries: Entry[] = [
					...STATIC_PATHS.map((path) => ({ path })),
					...data.communities.map((c) => ({
						path: `/community/${encodeURIComponent(c.id)}`,
						updatedAt: c.updatedAt,
					})),
					...data.events.map((e) => ({
						path: `/events/${encodeURIComponent(e.id)}`,
						updatedAt: e.updatedAt,
					})),
					...data.profiles.map((p) => ({
						path: `/user/${encodeURIComponent(p.profileUrl)}`,
						updatedAt: p.updatedAt,
					})),
				];
				const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.map(urlBlock).join("")}</urlset>`;
				return new Response(xml, {
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
