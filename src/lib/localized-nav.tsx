import { Link, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { DEFAULT_LOCALE, type Locale, useResolvedLocale } from "@/lib/i18n";

// All routes live under the optional `{-$locale}` segment. These helpers take a
// plain app path (e.g. "/account") and target the prefixed route id, carrying
// the active locale so in-app navigation stays in-language. English omits the
// param, so the URL stays unprefixed.

function prefixedTo(to: unknown): unknown {
	if (typeof to !== "string") return to;
	if (to === "/") return "/{-$locale}";
	if (to.startsWith("/{-$locale}")) return to;
	return `/{-$locale}${to}`;
}

function localeParam(locale: Locale) {
	return locale === DEFAULT_LOCALE ? undefined : locale;
}

// `to` is loosened to a plain app path (e.g. "/account") — we prefix it to the
// real `{-$locale}` route id internally. Other Link props stay typed.
type LinkProps = Omit<ComponentProps<typeof Link>, "to" | "params"> & {
	to?: string;
	params?: Record<string, unknown>;
};

export function LocalizedLink({ to, params, ...props }: LinkProps) {
	const locale = useResolvedLocale();
	return (
		<Link
			to={prefixedTo(to) as never}
			params={
				{
					...(typeof params === "object" && params !== null ? params : {}),
					locale: localeParam(locale),
				} as never
			}
			{...props}
		/>
	);
}

type NavigateArg = { to?: unknown; params?: Record<string, unknown> } & Record<
	string,
	unknown
>;

export function useLocalizedNavigate() {
	const navigate = useNavigate();
	const locale = useResolvedLocale();
	return (opts: NavigateArg) => {
		// Pass through anything that isn't a plain string-path navigation
		// (e.g. navigate(-1), or navigate({ search }) with no `to`).
		if (!opts || typeof opts !== "object" || typeof opts.to !== "string") {
			return navigate(opts as never);
		}
		return navigate({
			...opts,
			to: prefixedTo(opts.to),
			params: { ...(opts.params ?? {}), locale: localeParam(locale) },
		} as never);
	};
}
