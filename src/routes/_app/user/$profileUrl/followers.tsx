import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/user/$profileUrl/followers")({
  component: FollowersPage,
})

function FollowersPage() {
  const { profileUrl } = Route.useParams()
  const profile = useQuery(orpc.profile.byUrl.queryOptions({ input: { profileUrl } }))

  if (profile.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (profile.isError || !profile.data) return <p className="p-4">Profile not found.</p>

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>{profile.data.displayName || profile.data.profileUrl}'s followers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{profile.data.followersCount} total</p>
          <p className="text-muted-foreground text-sm mt-2">
            Follower list view coming soon — see profile.followers procedure for now.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
