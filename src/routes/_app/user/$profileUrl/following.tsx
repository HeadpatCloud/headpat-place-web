import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/user/$profileUrl/following")({
  component: FollowingPage,
})

function FollowingPage() {
  const { profileUrl } = Route.useParams()
  const profile = useQuery(orpc.profile.byUrl.queryOptions({ input: { profileUrl } }))

  if (profile.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (profile.isError || !profile.data) return <p className="p-4">Profile not found.</p>

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>{profile.data.displayName || profile.data.profileUrl} is following</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{profile.data.followingCount} total</p>
        </CardContent>
      </Card>
    </main>
  )
}
