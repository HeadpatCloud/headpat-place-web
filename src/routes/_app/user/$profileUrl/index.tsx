import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/user/$profileUrl/")({
  component: UserProfilePage,
})

function UserProfilePage() {
  const { profileUrl } = Route.useParams()
  const profile = useQuery(orpc.profile.byUrl.queryOptions({ input: { profileUrl } }))

  if (profile.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (profile.isError || !profile.data) return <p className="p-4">Profile not found.</p>
  const p = profile.data

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={undefined} alt={p.displayName ?? p.userId} />
              <AvatarFallback>{(p.displayName ?? "?").charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {p.displayName || p.profileUrl}
              </CardTitle>
              {p.status ? <p className="text-muted-foreground">{p.status}</p> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {p.bio ? <p>{p.bio}</p> : null}
          <div className="flex gap-2 flex-wrap">
            {p.pronouns ? <Badge variant="secondary">{p.pronouns}</Badge> : null}
            {p.location ? <Badge variant="secondary">{p.location}</Badge> : null}
            {(p.badges ?? []).map((b) => (
              <Badge key={b}>{b}</Badge>
            ))}
          </div>
          <Separator />
          <div className="flex gap-6 text-sm">
            <Link to={`/user/${profileUrl}/followers` as never} className="hover:underline">
              <span className="font-medium">{p.followersCount}</span>
              <span className="text-muted-foreground"> followers</span>
            </Link>
            <Link to={`/user/${profileUrl}/following` as never} className="hover:underline">
              <span className="font-medium">{p.followingCount}</span>
              <span className="text-muted-foreground"> following</span>
            </Link>
          </div>
          <Separator />
          <div className="flex gap-2 flex-wrap">
            {p.discordName ? <Badge variant="outline">Discord: {p.discordName}</Badge> : null}
            {p.telegramName ? <Badge variant="outline">Telegram: {p.telegramName}</Badge> : null}
            {p.furaffinityName ? <Badge variant="outline">FA: {p.furaffinityName}</Badge> : null}
            {p.xName ? <Badge variant="outline">X: {p.xName}</Badge> : null}
            {p.twitchName ? <Badge variant="outline">Twitch: {p.twitchName}</Badge> : null}
            {p.blueskyName ? <Badge variant="outline">Bluesky: {p.blueskyName}</Badge> : null}
          </div>
          <FollowButton targetUserId={p.userId} />
        </CardContent>
      </Card>
    </main>
  )
}

function FollowButton({ targetUserId }: { targetUserId: string }) {
  const status = useQuery(
    orpc.follow.status.queryOptions({ input: { targetUserId } }),
  )
  if (!status.data) return null
  return (
    <div className="flex gap-2">
      <Button variant={status.data.iFollow ? "outline" : "default"}>
        {status.data.iFollow ? "Following" : "Follow"}
      </Button>
      {status.data.followsMe ? (
        <Badge variant="secondary">Follows you</Badge>
      ) : null}
    </div>
  )
}
