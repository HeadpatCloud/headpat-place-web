import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/{-$locale}/admin/announcements/$announcementId")({ component: AnnouncementEditor })

const toDateInput = (d: string | Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "")

function AnnouncementEditor() {
  const { announcementId } = Route.useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const entry = useQuery(orpc.announcement.byId.queryOptions({ input: { announcementId } }))

  const [title, setTitle] = useState("")
  const [sideText, setSideText] = useState("")
  const [description, setDescription] = useState("")
  const [validUntil, setValidUntil] = useState("")

  useEffect(() => {
    const a = entry.data
    if (!a) return
    setTitle(a.title ?? "")
    setSideText(a.sideText ?? "")
    setDescription(a.description)
    setValidUntil(toDateInput(a.validUntil))
  }, [entry.data])

  const save = useMutation({
    mutationFn: () =>
      client.announcement.adminUpsert({
        id: announcementId,
        title: title.trim() || undefined,
        sideText: sideText.trim() || undefined,
        description: description.trim(),
        validUntil: validUntil ? new Date(validUntil) : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.announcement.byId.queryKey({ input: { announcementId } }) })
      qc.invalidateQueries({ queryKey: orpc.announcement.adminList.key() })
      toast.success("Saved.")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: () => client.announcement.adminDelete({ announcementId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.announcement.adminList.key() })
      toast.success("Deleted.")
      navigate({ to: "/admin/announcements" as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (entry.isPending) return <p className="text-muted-foreground">Loading…</p>
  if (entry.isError || !entry.data) {
    const notFound = (entry.error as { code?: string } | null)?.code === "NOT_FOUND"
    return (
      <p className="text-muted-foreground">
        {notFound
          ? "Announcement not found."
          : "Couldn't load this announcement — your session may have expired. Try signing in again."}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Edit announcement</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Details</CardTitle>
          <Button
            onClick={() => (description.trim() ? save.mutate() : toast.error("Description is required."))}
            disabled={save.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="an-title">Title</Label>
              <Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="an-side">Side text</Label>
              <Input id="an-side" value={sideText} onChange={(e) => setSideText(e.target.value)} maxLength={200} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-desc">Description</Label>
            <Textarea id="an-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={10000} rows={5} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="an-until" className="text-sm">Valid until</Label>
            <Input id="an-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-auto" />
            <span className="text-xs text-muted-foreground">Leave empty to show indefinitely.</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete announcement</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove.mutate()}
                  disabled={remove.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
