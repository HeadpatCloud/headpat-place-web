import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { ResponsiveImage } from "@/components/ResponsiveImage"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "@/lib/auth-client"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/gallery/$galleryId")({
  component: GalleryItemPage,
})

function GalleryItemPage() {
  const { galleryId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const item = useQuery(orpc.gallery.byId.queryOptions({ input: { itemId: galleryId } }))

  const deleteMut = useMutation({
    mutationFn: () => client.gallery.delete({ itemId: galleryId }),
    onSuccess: async () => {
      toast.success("Deleted.")
      await queryClient.invalidateQueries({ queryKey: ["gallery"] })
      navigate({ to: "/gallery" as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (item.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (item.isError || !item.data) return <p className="p-4">Not found.</p>
  const g = item.data
  const isOwner = session?.user?.id === g.userId

  return (
    <main>
      <Card className="overflow-hidden">
        <ResponsiveImage
          kind="gallery"
          fileId={g.fileId}
          alt={g.name}
          sizes="(min-width:768px) 768px, 100vw"
          className="w-full max-h-[80vh] object-contain bg-muted"
          fallback={<div className="h-96 w-full bg-muted" />}
        />
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle>{g.name}</CardTitle>
          {isOwner ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Removes the file from storage and the metadata row. This
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMut.mutate()}
                    disabled={deleteMut.isPending}
                  >
                    {deleteMut.isPending ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
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
