import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin/tickets/$ticketId")({ component: TicketThread })

function TicketThread() {
  const { ticketId } = Route.useParams()
  const qc = useQueryClient()
  const [reply, setReply] = useState("")
  const ticket = useQuery(orpc.ticket.get.queryOptions({ input: { ticketId } }))

  function invalidate() {
    qc.invalidateQueries({ queryKey: orpc.ticket.get.queryKey({ input: { ticketId } }) })
    qc.invalidateQueries({ queryKey: orpc.ticket.adminList.key() })
  }

  const send = useMutation({
    mutationFn: () => client.ticket.reply({ ticketId, body: reply.trim() }),
    onSuccess: () => {
      setReply("")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const setStatus = useMutation({
    mutationFn: (status: "open" | "closed") => client.ticket.setStatus({ ticketId, status }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })

  function submitReply() {
    if (!reply.trim()) {
      toast.error("Enter a reply first.")
      return
    }
    send.mutate()
  }

  if (ticket.isError) return <p className="text-muted-foreground">You don't have access to this.</p>
  if (ticket.isPending) return <p className="text-muted-foreground">Loading…</p>
  if (!ticket.data) return <p>Ticket not found.</p>

  const isClosed = ticket.data.status === "closed"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{ticket.data.subject}</CardTitle>
        <Button
          variant="outline"
          disabled={setStatus.isPending}
          onClick={() => setStatus.mutate(isClosed ? "open" : "closed")}
        >
          {isClosed ? "Reopen" : "Close"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {ticket.data.messages.map((m) => (
            <div key={m.id} className={`flex ${m.isStaff ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.isStaff ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <div className="mb-1 text-xs opacity-70">
                  {m.isStaff ? "Staff" : "User"} · {new Date(m.createdAt).toLocaleString()}
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        {isClosed ? (
          <p className="text-muted-foreground text-sm">This ticket is closed.</p>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply"
            />
            <Button
              disabled={send.isPending}
              onClick={submitReply}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Send
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
