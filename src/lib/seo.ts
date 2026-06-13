import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n";

export const SITE_URL = "https://headpat.place";
export const SITE_NAME = "Headpat";

const OG_LOCALE: Record<Locale, string> = {
	en: "en_US",
	de: "de_DE",
	nl: "nl_NL",
};

// Absolute URL for a given app path in a given locale. English is unprefixed.
export function localeUrl(path: string, locale: Locale): string {
	const clean = path === "/" ? "" : path;
	return locale === DEFAULT_LOCALE
		? `${SITE_URL}${clean || "/"}`
		: `${SITE_URL}/${locale}${clean}`;
}

type MetaTag = Record<string, string>;
type LinkTag = Record<string, string>;

// Builds the per-route <head> block: localized title, description, canonical,
// hreflang alternates (en/de/nl + x-default), and Open Graph / Twitter cards.
export function seo(opts: {
	title: string;
	description?: string;
	path: string;
	locale: Locale;
	image?: string;
	noindex?: boolean;
}): { meta: MetaTag[]; links: LinkTag[] } {
	const { title, description, path, locale, image, noindex } = opts;
	const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
	const canonical = localeUrl(path, locale);

	const meta: MetaTag[] = [
		{ title: fullTitle },
		...(description ? [{ name: "description", content: description }] : []),
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: SITE_NAME },
		{ property: "og:title", content: fullTitle },
		...(description
			? [{ property: "og:description", content: description }]
			: []),
		{ property: "og:url", content: canonical },
		{ property: "og:locale", content: OG_LOCALE[locale] },
		...LOCALES.filter((l) => l.code !== locale).map((l) => ({
			property: "og:locale:alternate",
			content: OG_LOCALE[l.code],
		})),
		...(image ? [{ property: "og:image", content: image }] : []),
		{
			name: "twitter:card",
			content: image ? "summary_large_image" : "summary",
		},
		{ name: "twitter:title", content: fullTitle },
		...(description
			? [{ name: "twitter:description", content: description }]
			: []),
		...(image ? [{ name: "twitter:image", content: image }] : []),
		...(noindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
	];

	const links: LinkTag[] = [{ rel: "canonical", href: canonical }];
	if (!noindex) {
		for (const l of LOCALES) {
			links.push({
				rel: "alternate",
				hreflang: l.code,
				href: localeUrl(path, l.code),
			});
		}
		links.push({
			rel: "alternate",
			hreflang: "x-default",
			href: localeUrl(path, DEFAULT_LOCALE),
		});
	}

	return { meta, links };
}
