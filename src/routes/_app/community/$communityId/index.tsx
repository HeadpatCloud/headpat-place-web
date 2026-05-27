import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { StorageImage, useStorageUrl } from "@/components/StorageImage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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

  const bannerUrl = useStorageUrl("community-banner", community.data?.bannerFileId)

  if (community.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (community.isError || !community.data) return <p className="p-4">Community not found.</p>
  const c = community.data
  const role = myRole.data?.role

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      {bannerUrl.data ? (
        <div
          className="h-48 w-full overflow-hidden rounded-lg bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerUrl.data.url})` }}
        />
      ) : null}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <StorageImage
                kind="community-avatar"
                fileId={c.avatarFileId}
                alt={c.name}
                className="h-14 w-14 rounded-full object-cover bg-muted"
                fallback={<div className="h-14 w-14 rounded-full bg-muted" />}
              />
              <div>
                <CardTitle className="text-2xl">{c.name}</CardTitle>
                <p className="text-muted-foreground">@{c.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={followStatus.data?.iFollow ? "outline" : "default"}
                onClick={() => toggleFollow.mutate()}
                disabled={toggleFollow.isPending}
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
        </CardHeader>
        <CardContent className="space-y-4">
          {c.description ? <p>{c.description}</p> : null}
          <div className="flex gap-2 flex-wrap">
            {(c.tags ?? []).map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
          <Separator />
          <div className="flex gap-6 text-sm">
            <Link to={`/community/${communityId}/followers` as never} className="hover:underline">
              <span className="font-medium">{c.followersCount}</span>
              <span className="text-muted-foreground"> followers</span>
            </Link>
            <Link to={`/community/${communityId}/events` as never} className="hover:underline">
              <span className="text-muted-foreground">View events →</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
