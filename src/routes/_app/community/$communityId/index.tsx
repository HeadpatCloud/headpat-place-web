import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { GradientBanner } from "@/components/GradientBanner"
import { StorageImage } from "@/components/StorageImage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/community/$communityId/")({
  component: CommunityDetailPage,
})

function CommunityDetailPage() {
  const { communityId } = Route.useParams()
  const qc = useQueryClient()
  const community = useQuery(
    orpc.community.byId.queryOptions({ input: { communityId } }),
  )
  const followStatus = useQuery(
    orpc.community.followStatus.queryOptions({ input: { communityId } }),
  )
  const myRole = useQuery(
    orpc.community.myRoleIn.queryOptions({ input: { communityId } }),
  )

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (followStatus.data?.iFollow) {
        return client.community.unfollow({ communityId })
      }
      return client.community.follow({ communityId })
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: orpc.community.followStatus.queryKey({ input: { communityId } }),
      })
      qc.invalidateQueries({
        queryKey: orpc.community.byId.queryKey({ input: { communityId } }),
      })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (community.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (community.isError || !community.data) return <p className="p-4">Community not found.</p>
  const c = community.data
  const role = myRole.data?.role

  return (
    <main className="space-y-6">
      <div className="overflow-hidden rounded-2xl border">
        <GradientBanner kind="community-banner" fileId={c.bannerFileId} aspect="3/1" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between gap-4 -mt-10 mb-4">
            <StorageImage
              kind="community-avatar"
              fileId={c.avatarFileId}
              alt={c.name}
              variant="md"
              className="h-20 w-20 shrink-0 rounded-xl border border-border object-cover bg-muted ring-4 ring-background"
              fallback={<div className="h-20 w-20 shrink-0 rounded-xl border border-border bg-muted ring-4 ring-background" />}
            />
            <div className="flex gap-2 pb-1">
              <Button
                onClick={() => toggleFollow.mutate()}
                disabled={toggleFollow.isPending}
                className={
                  followStatus.data?.iFollow
                    ? undefined
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
                variant={followStatus.data?.iFollow ? "outline" : "default"}
              >
                {followStatus.data?.iFollow ? "Following" : "Follow"}
              </Button>
              {role === "owner" || role === "admin" ? (
                <Button variant="secondary" asChild>
                  <Link to={`/community/${communityId}/admin` as never}>Admin</Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl font-extrabold tracking-tight">{c.name}</h1>
            <p className="text-muted-foreground">@{c.slug}</p>
          </div>
          <div className="flex gap-6 text-sm mb-4">
            <Link to={`/community/${communityId}/followers` as never} className="hover:underline">
              <b>{c.followersCount}</b>
              <span className="text-muted-foreground"> followers</span>
            </Link>
            <Link to={`/community/${communityId}/events` as never} className="text-muted-foreground hover:underline">
              View events →
            </Link>
          </div>
          {c.description ? <p className="mb-4">{c.description}</p> : null}
          <div className="flex gap-2 flex-wrap">
            {(c.tags ?? []).map((t) => (
              <Badge key={t} className="rounded-full bg-primary/15 text-primary border-transparent">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
