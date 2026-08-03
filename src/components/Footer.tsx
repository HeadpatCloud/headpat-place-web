import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";

const links = [
	{ labelKey: "privacy", href: "/legal/privacypolicy" },
	{ labelKey: "terms", href: "/legal/termsofservice" },
	{ labelKey: "acceptableUse", href: "/legal/acceptableuse" },
	{ labelKey: "imprint", href: "/legal/impressum" },
	{ labelKey: "legal", href: "/legal" },
];

export function Footer() {
	const t = useTranslations("footer");
	return (
		<footer className="mt-auto border-t border-border">
			<div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between xl:max-w-6xl 2xl:max-w-screen-2xl">
				<p>© {new Date().getFullYear()} Headpat</p>
				<nav aria-label={t("navLabel")}>
					<ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
						{links.map((l) => (
							<li key={l.href}>
								<Link
									to={l.href}
									className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{t(l.labelKey)}
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</footer>
	);
}
