import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/events/$eventId")({
  component: EventDetailPage,
})

function EventDetailPage() {
  const { eventId } = Route.useParams()
  const qc = useQueryClient()
  const event = useQuery(orpc.event.byId.queryOptions({ input: { eventId } }))
  const myAttending = useQuery(orpc.event.myAttending.queryOptions({ input: undefined }))

  const isAttending = (myAttending.data ?? []).some((a) => a.eventId === eventId)

  const toggle = useMutation({
    mutationFn: async () => {
      if (isAttending) return client.event.unattend({ eventId })
      return client.event.attend({ eventId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.event.myAttending.queryKey({ input: undefined }) })
      qc.invalidateQueries({ queryKey: orpc.event.byId.queryKey({ input: { eventId } }) })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (event.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (event.isError || !event.data) return <p className="p-4">Event not found.</p>
  const e = event.data

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{e.title}</CardTitle>
          {e.label ? <p className="text-muted-foreground">{e.label}</p> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(e.tags ?? []).map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
            {e.isPaid ? <Badge variant="default">Paid</Badge> : null}
          </div>
          {e.description ? <p>{e.description}</p> : null}
          <div className="text-sm">
            <p>
              <span className="font-medium">Starts:</span>{" "}
              {new Date(e.startsAt).toLocaleString()}
            </p>
            {e.endsAt ? (
              <p>
                <span className="font-medium">Ends:</span>{" "}
                {new Date(e.endsAt).toLocaleString()}
              </p>
            ) : null}
            {e.locationText ? (
              <p>
                <span className="font-medium">Location:</span> {e.locationText}
              </p>
            ) : null}
            {e.website ? (
              <p>
                <a href={e.website} className="text-link hover:underline">
                  Website
                </a>
              </p>
            ) : null}
          </div>
          <Button
            variant={isAttending ? "outline" : "default"}
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
          >
            {isAttending ? "Attending — cancel" : "Attend"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {e.attendeesCount} attending
            {e.visitorCapacity ? ` / ${e.visitorCapacity} max` : ""}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
