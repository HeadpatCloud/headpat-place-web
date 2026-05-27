import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { StorageImage } from "@/components/StorageImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/gallery/")({
  component: GalleryPage,
})

function GalleryPage() {
  const items = useQuery(orpc.gallery.list.queryOptions({ input: {} }))

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
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(items.data ?? []).map((g) => (
            <Link key={g.id} to={`/gallery/${g.id}` as never}>
              <Card className="hover:bg-accent transition-colors overflow-hidden">
                <StorageImage
                  kind="gallery"
                  fileId={g.fileId}
                  alt={g.name}
                  className="h-48 w-full object-cover bg-muted"
                  fallback={<div className="h-48 w-full bg-muted" />}
                />
                <CardHeader>
                  <CardTitle className="text-base truncate">{g.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {g.nsfw ? "NSFW " : ""}
                    {(g.tags ?? []).join(", ")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
