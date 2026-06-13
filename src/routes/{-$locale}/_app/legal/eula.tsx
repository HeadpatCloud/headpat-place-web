import { createFileRoute } from "@tanstack/react-router"
import Eula from "@/content/legal/eula.mdx"

export const Route = createFileRoute("/{-$locale}/_app/legal/eula")({
  component: EulaPage,
  head: () => ({ meta: [{ title: "EULA" }] }),
})

function EulaPage() {
  return (
    <main className="mx-auto max-w-3xl">
      <article className="prose-headpat">
        <Eula />
      </article>
    </main>
  )
}
