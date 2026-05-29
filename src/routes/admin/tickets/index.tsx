import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { UserCard, type UserSummary } from "@/components/UserCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin/tickets/")({ component: TicketsList })

const filters = [
  { label: "All", value: undefined },
  { label: "Open", value: "open" as const },
  { label: "Closed", value: "closed" as const },
]

function TicketsList() {
  const [status, setStatus] = useState<"open" | "closed" | undefined>(undefined)
  const tickets = useQuery(orpc.ticket.adminList.queryOptions({ input: { status } }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Tickets</h1>
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.label}
            size="sm"
            variant={status === f.value ? "default" : "outline"}
            className={status === f.value ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {tickets.isError ? (
        <p className="text-muted-foreground">You don't have access to this.</p>
      ) : tickets.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {(tickets.data ?? []).map((t) => (
            <Card key={t.id} className="space-y-2 p-3">
              <Link to={`/admin/tickets/${t.id}` as never} className="block">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{t.subject}</span>
                  <Badge variant={t.status === "open" ? "default" : "secondary"}>{t.status}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t.category} · {t.priority}
                </span>
              </Link>
              {t.author ? <UserCard user={t.author as UserSummary} /> : null}
            </Card>
          ))}
          {(tickets.data ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">No tickets.</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
