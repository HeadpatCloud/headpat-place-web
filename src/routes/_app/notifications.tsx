import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { Button } from "@/components/ui/button"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
})

const PAGE_SIZE = 30

function NotificationsPage() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()
  const list = useQuery(orpc.notification.list.queryOptions({ input: { page, pageSize: PAGE_SIZE } }))
  const items = list.data?.items ?? []
  const markAll = useMutation({
    mutationFn: async () => client.notification.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.notification.list.queryKey({ input: { page, pageSize: PAGE_SIZE } }) })
      qc.invalidateQueries({
        queryKey: orpc.notification.unreadCount.queryKey({ input: undefined }),
      })
    },
  })

  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Button variant="outline" onClick={() => markAll.mutate()}>
          Mark all read
        </Button>
      </div>
      {list.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No notifications.</p>
      ) : (
        <>
          <div className="space-y-1">
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg p-3 ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="h-9 w-9 shrink-0 rounded-lg border border-border bg-primary/15" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pager page={page} total={list.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </main>
  )
}
