import { createFileRoute } from "@tanstack/react-router";
import AcceptableUse from "@/content/legal/acceptableuse.mdx";
import { DEFAULT_LOCALE, type Locale, translate } from "@/lib/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/legal/acceptableuse")({
	component: AcceptableUsePage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.legalLinkAcceptableUse"),
			path: "/legal/acceptableuse",
			locale,
		});
	},
});

function AcceptableUsePage() {
	return (
		<main className="mx-auto max-w-3xl">
			<article className="prose-headpat">
				<AcceptableUse />
			</article>
		</main>
	);
}
