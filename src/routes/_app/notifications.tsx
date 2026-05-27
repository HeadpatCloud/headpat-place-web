import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
})

function NotificationsPage() {
  const qc = useQueryClient()
  const list = useQuery(orpc.notification.list.queryOptions({ input: {} }))
  const markAll = useMutation({
    mutationFn: async () => client.notification.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.notification.list.queryKey({ input: {} }) })
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
      ) : (list.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">No notifications.</p>
      ) : (
        <div className="space-y-2">
          {(list.data ?? []).map((n) => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="text-sm">{n.type}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
