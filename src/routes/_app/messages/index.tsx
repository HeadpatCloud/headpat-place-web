import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { StorageImage } from "@/components/StorageImage"
import { Card } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

type Other = {
  userId: string
  profileUrl: string
  displayName: string | null
  name: string | null
  avatarFileId: string | null
}

function conversationTitle(others: Other[]): string {
  if (others.length === 0) return "Just you"
  const names = others.map((o) => o.displayName || o.name || o.profileUrl)
  if (names.length <= 2) return names.join(", ")
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

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
    <main className="space-y-4">
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
                <Card className="hover:bg-accent flex flex-row items-center gap-3 p-3 transition-colors">
                  <StorageImage
                    kind="avatar"
                    fileId={c.others[0]?.avatarFileId}
                    variant="sm"
                    className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover bg-muted"
                    fallback={<div className="h-11 w-11 shrink-0 rounded-lg border border-border bg-muted" />}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {conversationTitle(c.others)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.lastMessageAt
                        ? `Last message: ${new Date(c.lastMessageAt).toLocaleString()}`
                        : "No messages yet"}
                    </p>
                  </div>
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
