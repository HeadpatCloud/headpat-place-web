import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { StorageImage } from "@/components/StorageImage"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/gallery/$galleryId")({
  component: GalleryItemPage,
})

function GalleryItemPage() {
  const { galleryId } = Route.useParams()
  const item = useQuery(orpc.gallery.byId.queryOptions({ input: { itemId: galleryId } }))

  if (item.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (item.isError || !item.data) return <p className="p-4">Not found.</p>
  const g = item.data

  return (
    <main className="mx-auto max-w-4xl">
      <Card className="overflow-hidden">
        <StorageImage
          kind="gallery"
          fileId={g.fileId}
          alt={g.name}
          className="w-full max-h-[80vh] object-contain bg-muted"
          fallback={<div className="h-96 w-full bg-muted" />}
        />
        <CardHeader>
          <CardTitle>{g.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {g.longText ? <p>{g.longText}</p> : null}
          <div className="flex gap-2 flex-wrap">
            {g.nsfw ? <Badge variant="destructive">NSFW</Badge> : null}
            {(g.tags ?? []).map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Uploaded {new Date(g.createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
