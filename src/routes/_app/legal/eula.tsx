import { createFileRoute } from "@tanstack/react-router"
import Eula from "@/content/legal/eula.mdx"

export const Route = createFileRoute("/_app/legal/eula")({
  component: EulaPage,
  head: () => ({ meta: [{ title: "EULA" }] }),
})

function EulaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <article className="prose-headpat">
        <Eula />
      </article>
    </main>
  )
}
