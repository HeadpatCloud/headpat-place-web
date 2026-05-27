import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/support")({
  component: SupportPage,
})

function SupportPage() {
  return (
    <div className="mx-auto mb-4 mt-8 max-w-7xl p-4">
      <div className="px-4 sm:px-0">
        <h3 className="text-base font-semibold leading-7">Help and contact</h3>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
          Get in touch with the Headpat team through any of these channels.
        </p>
      </div>
      <div className="mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Discord</dt>
            <dd className="mt-1 text-sm leading-6 text-black/80 sm:col-span-2 sm:mt-0 dark:text-white/80">
              For real-time help and chat with the community, join us on{" "}
              <a
                className="text-link hover:text-link/80"
                href="https://discord.gg/EaQTEKRg2A"
              >
                https://discord.gg/EaQTEKRg2A
              </a>
              .
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">E-Mail</dt>
            <dd className="mt-1 text-sm leading-6 text-black/80 sm:col-span-2 sm:mt-0 dark:text-white/80">
              Drop us a line at{" "}
              <a
                className="text-link hover:text-link/80"
                href="mailto:help@headpat.place"
              >
                help@headpat.place
              </a>
              .
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">GitHub</dt>
            <dd className="mt-1 text-sm leading-6 text-black/80 sm:col-span-2 sm:mt-0 dark:text-white/80">
              File bugs and contribute at{" "}
              <a
                className="text-link hover:text-link/80"
                href="https://github.com/Headpat-Community"
              >
                https://github.com/Headpat-Community
              </a>
              .
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
