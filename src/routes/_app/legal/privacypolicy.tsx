import { createFileRoute } from "@tanstack/react-router"
import PrivacyPolicy from "@/content/legal/privacypolicy.mdx"

export const Route = createFileRoute("/_app/legal/privacypolicy")({
  component: PrivacyPolicyPage,
  head: () => ({ meta: [{ title: "Privacy Policy" }] }),
})

function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <article className="prose-headpat">
        <PrivacyPolicy />
      </article>
    </main>
  )
}
