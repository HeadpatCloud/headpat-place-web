import {
	DEFAULT_LOCALE,
	isLocale,
	LOCALES,
	type Locale,
	translate,
} from "@/lib/i18n";

export const SITE_URL = "https://headpat.place";
export const SITE_NAME = "Headpat";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

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
	const { title, description, path, locale, noindex } = opts;
	const image = opts.image ?? DEFAULT_OG_IMAGE;
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
		{ property: "og:image", content: image },
		...(image === DEFAULT_OG_IMAGE
			? [
					{ property: "og:image:width", content: "1200" },
					{ property: "og:image:height", content: "630" },
					{ property: "og:image:alt", content: SITE_NAME },
				]
			: []),
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: fullTitle },
		...(description
			? [{ name: "twitter:description", content: description }]
			: []),
		{ name: "twitter:image", content: image },
		{
			name: "robots",
			content: noindex
				? "noindex,nofollow"
				: "index,follow,max-image-preview:large,max-snippet:-1",
		},
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

/** Head for routes that only need a translated title and a canonical. Private
 *  and transactional pages pass `noindex`. */
export function pageHead(
	titleKey: string,
	path: string,
	extra: { noindex?: boolean; descriptionKey?: string } = {},
) {
	return <P>({ params }: { params: P }) => {
		const raw = (params as { locale?: string }).locale;
		const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
		return seo({
			title: translate(locale, titleKey),
			description: extra.descriptionKey
				? translate(locale, extra.descriptionKey)
				: undefined,
			path,
			locale,
			noindex: extra.noindex,
		});
	};
}

export function jsonLdString(data: unknown): string {
	return JSON.stringify(data)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}
