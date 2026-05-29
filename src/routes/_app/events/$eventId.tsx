import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  const isPast = new Date(e.endsAt ?? e.startsAt).getTime() < Date.now()
  const attendWord = isPast ? "attended" : "attending"

  return (
    <main className="space-y-6">
      <div className="bg-sunset-hero rounded-2xl p-8 text-white space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{e.title}</h1>
        <p className="text-sm opacity-90">
          {new Date(e.startsAt).toLocaleString()}
          {e.endsAt ? ` — ${new Date(e.endsAt).toLocaleString()}` : ""}
        </p>
        {e.locationText ? (
          <p className="text-sm opacity-90">{e.locationText}</p>
        ) : null}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2 flex-wrap">
            {(e.tags ?? []).map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
            {e.isPaid ? <Badge variant="default">Paid</Badge> : null}
          </div>
          {e.label ? <p className="text-muted-foreground">{e.label}</p> : null}
          {e.description ? <p>{e.description}</p> : null}
          {e.website ? (
            <p className="text-sm">
              <a href={e.website} className="text-link hover:underline">
                Website
              </a>
            </p>
          ) : null}
          {isPast && !isAttending ? (
            <Button disabled variant="outline">Event has ended</Button>
          ) : (
            <Button
              onClick={() => toggle.mutate()}
              disabled={toggle.isPending}
              className={
                isAttending
                  ? undefined
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }
              variant={isAttending ? "outline" : "default"}
            >
              {isAttending ? "Attending — cancel" : "Attend"}
            </Button>
          )}
          {e.visitorCapacity ? (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, Math.round((e.attendeesCount / e.visitorCapacity) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {e.attendeesCount} / {e.visitorCapacity} {attendWord}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {e.attendeesCount} {attendWord}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
