import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { StorageImage } from "@/components/StorageImage"
import { Button } from "@/components/ui/button"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/gallery/")({
  component: GalleryPage,
})

function GalleryPage() {
  const items = useQuery(orpc.gallery.list.queryOptions({ input: { limit: 250 } }))

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gallery</h2>
        <Button asChild>
          <Link to={"/gallery/upload" as never}>+ Upload</Link>
        </Button>
      </div>
      {items.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (items.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">No images yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(items.data ?? []).map((g) => (
            <Link key={g.id} to={`/gallery/${g.id}` as never} className="zoom-parent block rounded-xl">
              <div className="relative">
                <StorageImage
                  kind="gallery"
                  fileId={g.fileId}
                  alt={g.name}
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
      )}
    </main>
  )
}
