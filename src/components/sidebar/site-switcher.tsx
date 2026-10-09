import { BrandLogo } from "@/components/BrandLogo";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";

export type Site = { name: string; href: string; active?: boolean };

export function SiteSwitcher({ sites }: { sites: Site[] }) {
	const t = useTranslations("commonUi");
	return (
		<div className="flex flex-col gap-4 pt-2">
			<Link to="/" className="flex items-center gap-2.5 px-2">
				<BrandLogo
					size="sm"
					alt=""
					width={40}
					height={40}
					className="size-10"
				/>
				<span className="font-display text-2xl font-semibold tracking-tight">
					headpat
				</span>
			</Link>
			<nav
				aria-label={t("siteSwitcher")}
				className="flex gap-0.5 rounded-full bg-muted p-1"
			>
				{sites.map((site) =>
					site.active ? (
						<span
							key={site.name}
							aria-current="page"
							className="flex-1 rounded-full bg-card py-1.5 text-center text-sm font-extrabold text-link shadow-sm"
						>
							{site.name}
						</span>
					) : (
						<a
							key={site.name}
							href={site.href}
							className="flex-1 rounded-full py-1.5 text-center text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
						>
							{site.name}
						</a>
					),
				)}
			</nav>
		</div>
	);
}
