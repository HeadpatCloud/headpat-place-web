import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FadeIn } from "@/components/FadeIn"
import { Pager } from "@/components/Pager"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/changelog")({
  component: ChangelogPage,
})

const PAGE_SIZE = 24

type Entry = {
  id: string
  title: string
  version: string | null
  description: string | null
  publishedAt: string | Date | null
  featuresWeb: string[]
  improvementsWeb: string[]
  bugfixesWeb: string[]
  featuresApp: string[]
  improvementsApp: string[]
  bugfixesApp: string[]
}

const KINDS = {
  features: { label: "Features", dot: "bg-emerald-500", text: "text-emerald-500" },
  improvements: { label: "Improvements", dot: "bg-indigo-500", text: "text-indigo-500" },
  bugfixes: { label: "Fixes", dot: "bg-amber-500", text: "text-amber-500" },
} as const

function fmtDate(d: string | Date | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
}

function ChangelogPage() {
  const [page, setPage] = useState(1)
  const list = useQuery(orpc.changelog.list.queryOptions({ input: { page, pageSize: PAGE_SIZE } }))
  const items = (list.data?.items ?? []) as Entry[]

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Changelog</h1>
      {list.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No releases yet.</p>
      ) : (
        <>
          <ol className="relative ml-1.5 space-y-8 border-l-2 border-border pl-8">
            {items.map((c, i) => (
              <li key={c.id} className="relative">
                <span className="absolute -left-[41px] top-1 size-4 rounded-full border-4 border-background bg-primary" />
                <FadeIn index={i}>
                  <Entry entry={c} latest={page === 1 && i === 0} />
                </FadeIn>
              </li>
            ))}
          </ol>
          <Pager page={page} total={list.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </main>
  )
}

function Entry({ entry, latest }: { entry: Entry; latest: boolean }) {
  const groups = [
    { kind: KINDS.features, platform: "Web", items: entry.featuresWeb },
    { kind: KINDS.improvements, platform: "Web", items: entry.improvementsWeb },
    { kind: KINDS.bugfixes, platform: "Web", items: entry.bugfixesWeb },
    { kind: KINDS.features, platform: "App", items: entry.featuresApp },
    { kind: KINDS.improvements, platform: "App", items: entry.improvementsApp },
    { kind: KINDS.bugfixes, platform: "App", items: entry.bugfixesApp },
  ].filter((g) => g.items.length > 0)
  const date = fmtDate(entry.publishedAt)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-lg font-bold tracking-tight">{entry.title}</h2>
        {entry.version ? (
          <span className="rounded-full bg-sunset-hero px-2.5 py-0.5 text-xs font-bold text-white">
            v{entry.version}
          </span>
        ) : null}
        {latest ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Latest
          </span>
        ) : null}
        {date ? <span className="text-xs text-muted-foreground">{date}</span> : null}
      </div>
      {entry.description ? <p className="mt-1.5 text-muted-foreground">{entry.description}</p> : null}
      {groups.length > 0 ? (
        <div className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {groups.map((g, idx) => (
            <div key={idx}>
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${g.kind.text}`}>
                <span className={`size-2 rounded-full ${g.kind.dot}`} />
                {g.kind.label}
                <span className="rounded border border-current px-1 text-[9px] font-bold opacity-80">{g.platform}</span>
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
                {g.items.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
