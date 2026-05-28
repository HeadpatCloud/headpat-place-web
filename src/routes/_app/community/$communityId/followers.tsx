import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/community/$communityId/followers")({
  component: CommunityFollowersPage,
})

const PAGE_SIZE = 30

function CommunityFollowersPage() {
  const { communityId } = Route.useParams()
  const [page, setPage] = useState(1)
  const followers = useQuery(
    orpc.community.followers.queryOptions({ input: { communityId, page, pageSize: PAGE_SIZE } }),
  )
  const items = followers.data?.items ?? []

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Followers</CardTitle>
        </CardHeader>
        <CardContent>
          {followers.isPending ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <>
              <ul className="divide-y">
                {items.map((f) => (
                  <li key={f.userId} className="py-2">
                    {f.userId}
                  </li>
                ))}
              </ul>
              <Pager page={page} total={followers.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
