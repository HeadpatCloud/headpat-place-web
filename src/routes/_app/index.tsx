import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { GradientBanner } from "@/components/GradientBanner"
import { StorageImage } from "@/components/StorageImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSession } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/")({ component: Landing })

function Landing() {
  const { data: session } = useSession()
  const communities = useQuery(orpc.community.list.queryOptions({ input: {} }))
  const users = useQuery(orpc.profile.list.queryOptions({ input: { limit: 3 } }))
  const topCommunities = (communities.data ?? []).slice(0, 3)
  const topUsers = (users.data ?? []).slice(0, 3)

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <section className="bg-sunset relative overflow-hidden rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {session?.user ? `Welcome back, ${session.user.name || "friend"} ✨` : "Welcome to Headpat"}
        </h1>
        <p className="mt-2 max-w-md text-white/85">
          Explore communities, share to the gallery, and keep up with friends.
        </p>
        <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to={(session?.user ? "/gallery" : "/login") as never}>
            {session?.user ? "Browse gallery" : "Log in"}
          </Link>
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Popular communities</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {topCommunities.map((c) => (
            <Link key={c.id} to={`/community/${c.id}` as never}>
              <Card className="card-hover overflow-hidden">
                <GradientBanner kind="community-banner" fileId={c.bannerFileId} className="h-20 w-full" />
                <CardContent className="flex items-center gap-3 pt-3">
                  <StorageImage
                    kind="community-avatar"
                    fileId={c.avatarFileId}
                    className="h-9 w-9 rounded-full object-cover bg-muted"
                    fallback={<div className="h-9 w-9 rounded-full bg-muted" />}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.followersCount} followers</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Suggested users</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {topUsers.map((u) => (
            <Link key={u.userId} to={`/user/${u.profileUrl}` as never}>
              <Card className="card-hover">
                <CardContent className="flex items-center gap-3 pt-6">
                  <StorageImage
                    kind="avatar"
                    fileId={u.avatarFileId}
                    className="h-10 w-10 rounded-full object-cover bg-muted"
                    fallback={<div className="h-10 w-10 rounded-full bg-muted" />}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{u.displayName || u.profileUrl}</p>
                    <p className="truncate text-xs text-muted-foreground">@{u.profileUrl}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
