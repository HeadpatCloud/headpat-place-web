import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/messages/")({
  component: MessagesPage,
})

const PAGE_SIZE = 30

function MessagesPage() {
  const [page, setPage] = useState(1)
  const conversations = useQuery(
    orpc.message.myConversations.queryOptions({ input: { page, pageSize: PAGE_SIZE } }),
  )
  const items = conversations.data?.items ?? []

  return (
    <main className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-2xl font-bold">Messages</h2>
      {conversations.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No conversations yet.</p>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((c) => (
              <Link
                key={c.id}
                to={`/messages/${c.id}` as never}
                className="block"
              >
                <Card className="hover:bg-accent transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Conversation {c.id.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {c.lastMessageAt ? (
                      <p className="text-xs text-muted-foreground">
                        Last message:{" "}
                        {new Date(c.lastMessageAt).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No messages yet</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pager page={page} total={conversations.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </main>
  )
}
