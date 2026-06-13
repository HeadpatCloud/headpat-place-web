import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicy from "@/content/legal/privacypolicy.mdx";

export const Route = createFileRoute("/{-$locale}/_app/legal/privacypolicy")({
	component: PrivacyPolicyPage,
	head: () => ({ meta: [{ title: "Privacy Policy" }] }),
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
