import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/community/$communityId/followers")({
  component: CommunityFollowersPage,
})

function CommunityFollowersPage() {
  const { communityId } = Route.useParams()
  const followers = useQuery(
    orpc.community.followers.queryOptions({ input: { communityId } }),
  )

  return (
    <main className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Followers</CardTitle>
        </CardHeader>
        <CardContent>
          {followers.isPending ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y">
              {(followers.data ?? []).map((f) => (
                <li key={f.userId} className="py-2">
                  {f.userId}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
