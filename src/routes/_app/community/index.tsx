import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Pager } from "@/components/Pager"
import { GradientBanner } from "@/components/GradientBanner"
import { StorageImage } from "@/components/StorageImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/community/")({
  component: CommunitiesPage,
})

const PAGE_SIZE = 24

function CommunitiesPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [search])

  const list = useQuery(
    orpc.community.list.queryOptions({
      input: search ? { search, page, pageSize: PAGE_SIZE } : { page, pageSize: PAGE_SIZE },
    }),
  )
  const items = list.data?.items ?? []

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Communities</h2>
        <Button asChild>
          <Link to={"/community/new" as never}>+ Create</Link>
        </Button>
      </div>
      <Input
        placeholder="Search communities…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {list.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <Link key={c.id} to={`/community/${c.id}` as never}>
                <Card className="card-hover overflow-hidden">
                  <GradientBanner kind="community-banner" fileId={c.bannerFileId} className="h-24 w-full" />
                  <CardHeader className="flex flex-row items-center gap-3">
                    <StorageImage
                      kind="community-avatar"
                      fileId={c.avatarFileId}
                      variant="sm"
                      className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover bg-muted"
                      fallback={<div className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted" />}
                    />
                    <CardTitle className="font-bold">{c.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {c.description ?? "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {c.followersCount} followers
                    </p>
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/15 text-primary border-transparent text-xs px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pager page={page} total={list.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </main>
  )
}
