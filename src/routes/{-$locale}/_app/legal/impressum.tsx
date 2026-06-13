import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/_app/legal/impressum")({
  component: ImpressumPage,
  head: () => ({ meta: [{ title: "Impressum" }] }),
})

function ImpressumPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl text-base leading-7">
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Impressum
        </h1>
        <br />
        <p>Information according to § 5 TMG.</p>
        <br />
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Contact
        </h2>
        <br />
        <p>
          Only on request:{" "}
          <a href="mailto:help@headpat.place">help@headpat.place</a>
        </p>
        <br />
        <p>
          <strong>Contact info</strong>
        </p>
        <p>
          E-Mail: <a href="mailto:help@headpat.place">help@headpat.place</a>
        </p>
        <p>
          Website: <a href="https://headpat.place">https://headpat.place</a>
        </p>
        <br />
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Online dispute resolution
        </h2>
        <p>
          The European Commission provides a platform for online dispute
          resolution, available here:{" "}
          <a
            className="text-link hover:text-link/80"
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noreferrer"
          >
            https://ec.europa.eu/consumers/odr/
          </a>
          <br />
          <br />I am neither willing nor obliged to participate in dispute
          resolution proceedings in front of a consumer arbitration board.
        </p>
      </div>
    </div>
  )
}
