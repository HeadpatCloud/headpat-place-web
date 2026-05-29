import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Pager } from "@/components/Pager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin/changelog/")({ component: ChangelogAdmin })

const pageSize = 24

function ChangelogAdmin() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const list = useQuery(orpc.changelog.adminList.queryOptions({ input: { page, pageSize } }))

  const create = useMutation({
    mutationFn: () => client.changelog.adminUpsert({ title: "Untitled release", draft: true }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: orpc.changelog.adminList.key() })
      navigate({ to: `/admin/changelog/${r.id}` as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Changelog</h1>
        <Button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + New entry
        </Button>
      </div>

      {list.isError ? (
        <p className="text-muted-foreground">You don't have access to this.</p>
      ) : list.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="space-y-2">
            {list.data.items.map((c) => (
              <Link key={c.id} to={`/admin/changelog/${c.id}` as never} className="block">
                <Card className="card-hover flex items-center justify-between p-3">
                  <span className="font-semibold">
                    {c.title}
                    {c.version ? <span className="ml-2 text-xs text-muted-foreground">v{c.version}</span> : null}
                  </span>
                  <span className="flex items-center gap-2">
                    {c.draft ? (
                      <Badge variant="secondary">draft</Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary border-transparent">published</Badge>
                    )}
                    {c.publishedAt ? (
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.publishedAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </span>
                </Card>
              </Link>
            ))}
            {list.data.items.length === 0 ? <p className="text-muted-foreground text-sm">No entries.</p> : null}
          </div>
          <Pager page={list.data.page} total={list.data.total} pageSize={list.data.pageSize} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
