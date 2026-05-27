import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/legal/eula")({
  component: EulaPage,
  head: () => ({ meta: [{ title: "EULA" }] }),
})

function EulaPage() {
  return (
    <div className="px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7">
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          EULA
        </h1>
        <p className="mt-4 text-muted-foreground">
          The EULA is being ported from MDX. View the canonical version at{" "}
          <a
            className="text-link hover:underline"
            href="https://headpat.place/legal/eula"
          >
            headpat.place/legal/eula
          </a>
          .
        </p>
      </div>
    </div>
  )
}
