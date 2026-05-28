import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { UserCard } from "@/components/UserCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/user/$profileUrl/followers")({
  component: FollowersPage,
})

const PAGE_SIZE = 30

function FollowersPage() {
  const { profileUrl } = Route.useParams()
  const [page, setPage] = useState(1)
  const profile = useQuery(orpc.profile.byUrl.queryOptions({ input: { profileUrl } }))
  const followers = useQuery({
    ...orpc.follow.followers.queryOptions({
      input: { userId: profile.data?.userId ?? "", page, pageSize: PAGE_SIZE },
    }),
    enabled: !!profile.data?.userId,
  })

  if (profile.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (profile.isError || !profile.data) return <p className="p-4">Profile not found.</p>

  const name = profile.data.displayName || profile.data.profileUrl
  const items = followers.data?.items ?? []

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>{name}'s followers</CardTitle>
        </CardHeader>
        <CardContent>
          {followers.isPending ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No followers yet.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((u) => (
                  <UserCard key={u.userId} user={u} />
                ))}
              </div>
              <Pager page={page} total={followers.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
