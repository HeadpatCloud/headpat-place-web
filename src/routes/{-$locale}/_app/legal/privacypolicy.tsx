import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicy from "@/content/legal/privacypolicy.mdx";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/legal/privacypolicy")({
	component: PrivacyPolicyPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.legalLinkPrivacy"),
			path: "/legal/privacypolicy",
			locale,
		});
	},
});

function PrivacyPolicyPage() {
	return (
		<main className="mx-auto max-w-3xl">
			<article className="prose-headpat">
				<PrivacyPolicy />
			</article>
		</main>
	);
}
