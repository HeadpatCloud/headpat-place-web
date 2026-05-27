import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/legal/privacypolicy")({
  component: PrivacyPolicyPage,
  head: () => ({ meta: [{ title: "Privacy Policy" }] }),
})

function PrivacyPolicyPage() {
  return (
    <div className="px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7">
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-muted-foreground">
          The privacy policy is being ported from MDX. View the canonical
          version at{" "}
          <a
            className="text-link hover:underline"
            href="https://headpat.place/legal/privacypolicy"
          >
            headpat.place/legal/privacypolicy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
