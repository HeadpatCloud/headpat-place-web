import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Pager } from "@/components/Pager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin/announcements/")({ component: AnnouncementsAdmin })

const pageSize = 24

function AnnouncementsAdmin() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const list = useQuery(orpc.announcement.adminList.queryOptions({ input: { page, pageSize } }))

  const create = useMutation({
    mutationFn: () => client.announcement.adminUpsert({ description: "New announcement" }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: orpc.announcement.adminList.key() })
      navigate({ to: `/admin/announcements/${r.id}` as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Announcements</h1>
        <Button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + New announcement
        </Button>
      </div>

      {list.isError ? (
        <p className="text-muted-foreground">You don't have access to this.</p>
      ) : list.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="space-y-2">
            {list.data.items.map((a) => {
              const expired = a.validUntil ? new Date(a.validUntil).getTime() < Date.now() : false
              return (
                <Link key={a.id} to={`/admin/announcements/${a.id}` as never} className="block">
                  <Card className="card-hover flex items-center justify-between gap-3 p-3">
                    <span className="min-w-0">
                      <span className="font-semibold">{a.title || "Untitled"}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.description}</span>
                    </span>
                    {expired ? (
                      <Badge variant="secondary">expired</Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary border-transparent">active</Badge>
                    )}
                  </Card>
                </Link>
              )
            })}
            {list.data.items.length === 0 ? <p className="text-muted-foreground text-sm">No announcements.</p> : null}
          </div>
          <Pager page={list.data.page} total={list.data.total} pageSize={list.data.pageSize} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
