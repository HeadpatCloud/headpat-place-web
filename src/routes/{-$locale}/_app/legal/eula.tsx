import { createFileRoute } from "@tanstack/react-router";
import Eula from "@/content/legal/eula.mdx";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/legal/eula")({
	component: EulaPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.legalLinkEula"),
			path: "/legal/eula",
			locale,
		});
	},
});

function EulaPage() {
	return (
		<main className="mx-auto max-w-3xl">
			<article className="prose-headpat">
				<Eula />
			</article>
		</main>
	);
}
