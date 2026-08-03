import { createFileRoute } from "@tanstack/react-router";
import TermsOfService from "@/content/legal/termsofservice.mdx";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/legal/termsofservice")({
	component: TermsOfServicePage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.legalLinkTerms"),
			path: "/legal/termsofservice",
			locale,
		});
	},
});

function TermsOfServicePage() {
	return (
		<main className="mx-auto max-w-3xl">
			<article className="prose-headpat">
				<TermsOfService />
			</article>
		</main>
	);
}
