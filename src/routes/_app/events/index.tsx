import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/events/")({
  component: EventsPage,
})

function EventsPage() {
  const events = useQuery(orpc.event.list.queryOptions({ input: {} }))

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <h2 className="text-2xl font-bold">Events</h2>
      {events.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (events.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">No events yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(events.data ?? []).map((e) => (
            <Link key={e.id} to={`/events/${e.id}` as never}>
              <Card className="hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle>{e.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {new Date(e.startsAt).toLocaleString()}
                  </p>
                  {e.locationText ? <p className="text-sm">{e.locationText}</p> : null}
                  <div className="flex gap-1 flex-wrap">
                    {(e.tags ?? []).map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {e.attendeesCount} attending
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
