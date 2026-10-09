import { useParams } from "@tanstack/react-router";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { type TranslateOptions, translateFrom } from "./translate";
import en from "./translations/en.json";

export const LOCALES = [
	{ code: "en", label: "English" },
	{ code: "de", label: "Deutsch" },
	{ code: "nl", label: "Nederlands" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "hp-locale";

export function isLocale(value: unknown): value is Locale {
	return typeof value === "string" && LOCALES.some((l) => l.code === value);
}

type Messages = typeof en;
const MESSAGES: Partial<Record<Locale, Messages>> = { en };
const LOADERS = {
	de: () => import("./translations/de.json"),
	nl: () => import("./translations/nl.json"),
};

async function loadLocale(locale: "de" | "nl") {
	MESSAGES[locale] ??= (await LOADERS[locale]()).default as Messages;
}

// Only the active locale ships to the browser (the URL prefix decides it, and a
// language switch is a full navigation). The server serves every locale.
if (typeof window === "undefined") {
	await Promise.all([loadLocale("de"), loadLocale("nl")]);
} else {
	const prefix = /^\/(de|nl)(?=\/|$)/.exec(window.location.pathname)?.[1];
	if (prefix === "de" || prefix === "nl") await loadLocale(prefix);
}

// English is the canonical key set; de/nl fall back to it. Keys absent here are
// not yet translated — show a humanised label instead of "[missing …]".
function keyExists(key: string): boolean {
	let node: unknown = en;
	for (const part of key.split(".")) {
		if (node && typeof node === "object" && part in node) {
			node = (node as Record<string, unknown>)[part];
		} else {
			return false;
		}
	}
	return true;
}

function humanise(key: string): string {
	const last = key.split(".").pop() ?? key;
	return last.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function translate(
	locale: Locale,
	key: string,
	options?: TranslateOptions,
): string {
	if (!keyExists(key)) return humanise(key);
	const own = MESSAGES[locale];
	const chain = own && locale !== DEFAULT_LOCALE ? [own, en] : [en];
	return translateFrom(chain, key, options) ?? humanise(key);
}

interface LocaleContextValue {
	locale: Locale;
	setLocale: (locale: Locale) => void;
	t: (key: string, options?: TranslateOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function useLocaleContext(): LocaleContextValue {
	const ctx = useContext(LocaleContext);
	if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
	return ctx;
}

// Strips a leading /de or /nl prefix and re-applies the target one. A locale
// switch is a full navigation so SSR re-renders the page (lang, meta, content)
// in the new language with no hydration mismatch.
export function localizedPath(pathname: string, locale: Locale): string {
	const stripped = pathname.replace(/^\/(de|nl)(?=\/|$)/, "") || "/";
	if (locale === DEFAULT_LOCALE) return stripped;
	return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}

export function LocaleProvider({
	locale,
	children,
}: {
	locale: Locale;
	children: ReactNode;
}) {
	const value = useMemo<LocaleContextValue>(
		() => ({
			locale,
			t: (key, options) => translate(locale, key, options),
			setLocale: (next) => {
				if (typeof window === "undefined") return;
				document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
				const { pathname, search, hash } = window.location;
				window.location.assign(
					`${localizedPath(pathname, next)}${search}${hash}`,
				);
			},
		}),
		[locale],
	);

	return (
		<LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
	);
}

export function useI18n(): LocaleContextValue {
	return useLocaleContext();
}

export function useLocale(): Locale {
	return useLocaleContext().locale;
}

export function useTranslations(namespace: string) {
	const { t } = useLocaleContext();
	return (key: string, options?: TranslateOptions) =>
		t(`${namespace}.${key}`, options);
}

export type TFunction = ReturnType<typeof useTranslations>;

// Reads the active locale from the {-$locale} route param. Returns the default
// until the locale-prefixed routes exist (phase B), then resolves for real.
export function useResolvedLocale(): Locale {
	const params = useParams({ strict: false }) as { locale?: string };
	return isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
}
