import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/community/$communityId/events/")({
  component: CommunityEventsPage,
})

function CommunityEventsPage() {
  const { communityId } = Route.useParams()
  const events = useQuery(
    orpc.event.listByCommunity.queryOptions({ input: { communityId } }),
  )

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <h2 className="text-2xl font-bold">Events</h2>
      {events.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (events.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">No events yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(events.data ?? []).map((e) => (
            <Link key={e.id} to={`/events/${e.id}` as never}>
              <Card className="hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle>{e.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(e.startsAt).toLocaleString()}
                  </p>
                  {e.locationText ? (
                    <p className="text-sm">{e.locationText}</p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
