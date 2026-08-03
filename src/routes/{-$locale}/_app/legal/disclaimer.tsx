import { createFileRoute } from "@tanstack/react-router";
import Disclaimer from "@/content/legal/disclaimer.mdx";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/legal/disclaimer")({
	component: DisclaimerPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.legalLinkDisclaimer"),
			path: "/legal/disclaimer",
			locale,
		});
	},
});

function DisclaimerPage() {
	return (
		<main className="mx-auto max-w-3xl">
			<article className="prose-headpat">
				<Disclaimer />
			</article>
		</main>
	);
}
