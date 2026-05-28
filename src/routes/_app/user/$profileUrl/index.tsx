import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { GradientBanner } from "@/components/GradientBanner"
import { useStorageUrl } from "@/components/StorageImage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/user/$profileUrl/")({
  component: UserProfilePage,
})

function UserProfilePage() {
  const { profileUrl } = Route.useParams()
  const profile = useQuery(orpc.profile.byUrl.queryOptions({ input: { profileUrl } }))
  const avatarUrl = useStorageUrl("avatar", profile.data?.avatarFileId)

  if (profile.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (profile.isError || !profile.data) return <p className="p-4">Profile not found.</p>
  const p = profile.data

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="overflow-hidden rounded-2xl border">
        <GradientBanner kind="banner" fileId={p.bannerFileId} className="h-48 w-full" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-background">
              <AvatarImage src={avatarUrl.data?.url} alt={p.displayName ?? p.userId} />
              <AvatarFallback>{(p.displayName ?? "?").charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-extrabold tracking-tight">{p.displayName || p.profileUrl}</h1>
              {p.status ? <p className="text-muted-foreground">{p.status}</p> : null}
            </div>
            <FollowButton targetUserId={p.userId} />
          </div>
          <div className="mt-4 space-y-4">
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
              {p.discordName ? <Badge className="rounded-full bg-primary/15 text-primary border-transparent">Discord: {p.discordName}</Badge> : null}
              {p.telegramName ? <Badge className="rounded-full bg-primary/15 text-primary border-transparent">Telegram: {p.telegramName}</Badge> : null}
              {p.furaffinityName ? <Badge className="rounded-full bg-primary/15 text-primary border-transparent">FA: {p.furaffinityName}</Badge> : null}
              {p.xName ? <Badge className="rounded-full bg-primary/15 text-primary border-transparent">X: {p.xName}</Badge> : null}
              {p.twitchName ? <Badge className="rounded-full bg-primary/15 text-primary border-transparent">Twitch: {p.twitchName}</Badge> : null}
              {p.blueskyName ? <Badge className="rounded-full bg-primary/15 text-primary border-transparent">Bluesky: {p.blueskyName}</Badge> : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function FollowButton({ targetUserId }: { targetUserId: string }) {
  const status = useQuery(
    orpc.follow.status.queryOptions({ input: { targetUserId } }),
  )
  if (!status.data) return null
  return (
    <div className="flex gap-2 pb-1">
      <Button
        variant={status.data.iFollow ? "outline" : "default"}
        className={status.data.iFollow ? undefined : "bg-primary text-primary-foreground hover:bg-primary/90"}
      >
        {status.data.iFollow ? "Following" : "Follow"}
      </Button>
      {status.data.followsMe ? (
        <Badge variant="secondary">Follows you</Badge>
      ) : null}
    </div>
  )
}
