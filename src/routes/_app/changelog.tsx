import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/changelog")({
  component: ChangelogPage,
})

const PAGE_SIZE = 24

function ChangelogPage() {
  const [page, setPage] = useState(1)
  const list = useQuery(orpc.changelog.list.queryOptions({ input: { page, pageSize: PAGE_SIZE } }))
  const items = list.data?.items ?? []

  return (
    <main className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-2xl font-bold">Changelog</h2>
      {list.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Nothing here yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle>
                    {c.title}
                    {c.version ? (
                      <span className="text-muted-foreground text-sm font-normal ml-2">
                        v{c.version}
                      </span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.description ? <p>{c.description}</p> : null}
                  {c.featuresWeb.length > 0 ? (
                    <Section title="New features (web)" items={c.featuresWeb} />
                  ) : null}
                  {c.improvementsWeb.length > 0 ? (
                    <Section title="Improvements (web)" items={c.improvementsWeb} />
                  ) : null}
                  {c.bugfixesWeb.length > 0 ? (
                    <Section title="Bug fixes (web)" items={c.bugfixesWeb} />
                  ) : null}
                  {c.featuresApp.length > 0 ? (
                    <Section title="New features (app)" items={c.featuresApp} />
                  ) : null}
                  {c.improvementsApp.length > 0 ? (
                    <Section title="Improvements (app)" items={c.improvementsApp} />
                  ) : null}
                  {c.bugfixesApp.length > 0 ? (
                    <Section title="Bug fixes (app)" items={c.bugfixesApp} />
                  ) : null}
                  {c.publishedAt ? (
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.publishedAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
          <Pager page={page} total={list.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </main>
  )
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="list-disc pl-5 text-sm">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  )
}
