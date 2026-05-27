import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/messages")({
  component: MessagesPage,
})

function MessagesPage() {
  const conversations = useQuery(
    orpc.message.myConversations.queryOptions({ input: undefined }),
  )

  return (
    <main className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-2xl font-bold">Messages</h2>
      {conversations.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (conversations.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">No conversations yet.</p>
      ) : (
        <div className="space-y-2">
          {(conversations.data ?? []).map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">Conversation {c.id}</CardTitle>
              </CardHeader>
              <CardContent>
                {c.lastMessageAt ? (
                  <p className="text-xs text-muted-foreground">
                    Last message: {new Date(c.lastMessageAt).toLocaleString()}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
