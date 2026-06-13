import { Link, createFileRoute } from "@tanstack/react-router"
import { Paperclip } from "lucide-react"

export const Route = createFileRoute("/{-$locale}/_app/legal/")({
  component: LegalPage,
})

type LegalLink = { label: string; href: string; ext?: string; tanstack?: boolean }

const links: LegalLink[] = [
  { label: "Impressum", href: "/legal/impressum", tanstack: true },
  { label: "Terms of Service", href: "/legal/termsofservice.pdf", ext: "PDF" },
  { label: "Privacy policy", href: "/legal/privacypolicy", tanstack: true },
  { label: "EULA", href: "/legal/eula", tanstack: true },
  { label: "Disclaimer", href: "/legal/disclaimer.pdf", ext: "PDF" },
  { label: "Acceptable use", href: "/legal/acceptableuse.pdf", ext: "PDF" },
]

function LegalPage() {
  return (
    <div>
      <div className="px-4 sm:px-0">
        <h3 className="text-base font-semibold leading-7">Legal information</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          Notices, terms and policies governing your use of headpat.place.
        </p>
      </div>
      <div className="mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">About</dt>
            <dd className="mt-1 text-sm leading-6 text-black/80 sm:col-span-2 sm:mt-0 dark:text-white/80">
              Questions? Reach out at{" "}
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
            <dt className="text-sm font-medium leading-6">Attachments</dt>
            <dd className="mt-2 text-sm sm:col-span-2 sm:mt-0">
              <ul
                role="list"
                className="divide-y divide-gray-100 rounded-md border border-gray-700 dark:border-gray-200"
              >
                {links.map((l) => (
                  <li
                    key={l.href}
                    className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6"
                  >
                    <div className="flex w-0 flex-1 items-center">
                      <Paperclip
                        className="h-5 w-5 shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                        <span className="truncate font-medium">{l.label}</span>
                        {l.ext ? (
                          <span className="shrink-0 text-gray-400">{l.ext}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="ml-4 shrink-0">
                      {l.tanstack ? (
                        <Link
                          to={l.href as never}
                          className="text-link hover:text-link/80 font-medium"
                        >
                          View
                        </Link>
                      ) : (
                        <a
                          href={l.href}
                          className="text-link hover:text-link/80 font-medium"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
