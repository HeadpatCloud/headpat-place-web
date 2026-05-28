import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { StorageImage } from "@/components/StorageImage"
import { Button } from "@/components/ui/button"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/gallery/")({
  component: GalleryPage,
})

const PAGE_SIZE = 24

function GalleryPage() {
  const [page, setPage] = useState(1)
  const query = useQuery(orpc.gallery.list.queryOptions({ input: { page, pageSize: PAGE_SIZE } }))
  const items = query.data?.items ?? []

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gallery</h2>
        <Button asChild>
          <Link to={"/gallery/upload" as never}>+ Upload</Link>
        </Button>
      </div>
      {query.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No images yet.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((g) => (
              <Link key={g.id} to={`/gallery/${g.id}` as never} className="zoom-parent block rounded-xl">
                <div className="relative">
                  <StorageImage
                    kind="gallery"
                    fileId={g.fileId}
                    alt={g.name}
                    variant="thumb"
                    className="zoom-img h-56 w-full object-cover bg-muted"
                    fallback={<div className="h-56 w-full bg-muted" />}
                  />
                  {g.nsfw ? <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-white">NSFW</span> : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="truncate font-semibold text-white">{g.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pager page={page} total={query.data?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </main>
  )
}
