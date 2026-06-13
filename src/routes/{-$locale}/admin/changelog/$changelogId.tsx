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

export const Route = createFileRoute("/{-$locale}/admin/changelog/$changelogId")({ component: ChangelogEditor })

const CATS = [
  { key: "featuresWeb", label: "Features — Web" },
  { key: "improvementsWeb", label: "Improvements — Web" },
  { key: "bugfixesWeb", label: "Fixes — Web" },
  { key: "featuresApp", label: "Features — App" },
  { key: "improvementsApp", label: "Improvements — App" },
  { key: "bugfixesApp", label: "Fixes — App" },
] as const

type CatKey = (typeof CATS)[number]["key"]

const toText = (arr: string[]) => arr.join("\n")
const toArr = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean)
const toDateInput = (d: string | Date | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : ""

function ChangelogEditor() {
  const { changelogId } = Route.useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const entry = useQuery(orpc.changelog.adminById.queryOptions({ input: { changelogId } }))

  const [title, setTitle] = useState("")
  const [version, setVersion] = useState("")
  const [description, setDescription] = useState("")
  const [draft, setDraft] = useState(false)
  const [publishedAt, setPublishedAt] = useState("")
  const [cats, setCats] = useState<Record<CatKey, string>>({
    featuresWeb: "", improvementsWeb: "", bugfixesWeb: "", featuresApp: "", improvementsApp: "", bugfixesApp: "",
  })

  useEffect(() => {
    const e = entry.data
    if (!e) return
    setTitle(e.title)
    setVersion(e.version ?? "")
    setDescription(e.description ?? "")
    setDraft(e.draft)
    setPublishedAt(toDateInput(e.publishedAt))
    setCats({
      featuresWeb: toText(e.featuresWeb), improvementsWeb: toText(e.improvementsWeb), bugfixesWeb: toText(e.bugfixesWeb),
      featuresApp: toText(e.featuresApp), improvementsApp: toText(e.improvementsApp), bugfixesApp: toText(e.bugfixesApp),
    })
  }, [entry.data])

  const save = useMutation({
    mutationFn: () =>
      client.changelog.adminUpsert({
        id: changelogId,
        title: title.trim(),
        version: version.trim() || undefined,
        description: description.trim() || undefined,
        draft,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        featuresWeb: toArr(cats.featuresWeb),
        improvementsWeb: toArr(cats.improvementsWeb),
        bugfixesWeb: toArr(cats.bugfixesWeb),
        featuresApp: toArr(cats.featuresApp),
        improvementsApp: toArr(cats.improvementsApp),
        bugfixesApp: toArr(cats.bugfixesApp),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.changelog.adminById.queryKey({ input: { changelogId } }) })
      qc.invalidateQueries({ queryKey: orpc.changelog.adminList.key() })
      toast.success("Saved.")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: () => client.changelog.adminDelete({ changelogId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.changelog.adminList.key() })
      toast.success("Deleted.")
      navigate({ to: "/admin/changelog" as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (entry.isPending) return <p className="text-muted-foreground">Loading…</p>
  if (entry.isError || !entry.data) {
    const notFound = (entry.error as { code?: string } | null)?.code === "NOT_FOUND"
    return (
      <p className="text-muted-foreground">
        {notFound
          ? "Entry not found."
          : "Couldn't load this entry — your session may have expired. Try signing in again."}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Edit changelog entry</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Details</CardTitle>
          <Button
            onClick={() => (title.trim() ? save.mutate() : toast.error("Title is required."))}
            disabled={save.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cl-title">Title</Label>
              <Input id="cl-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-version">Version</Label>
              <Input id="cl-version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="0.9.0" maxLength={40} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cl-desc">Description</Label>
            <Textarea id="cl-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={10000} />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
              Draft (hidden from the public changelog)
            </label>
            <div className="flex items-center gap-2">
              <Label htmlFor="cl-date" className="text-sm">Published</Label>
              <Input id="cl-date" type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {CATS.map((c) => (
            <div key={c.key} className="space-y-1.5">
              <Label htmlFor={`cl-${c.key}`}>{c.label}</Label>
              <Textarea
                id={`cl-${c.key}`}
                value={cats[c.key]}
                onChange={(e) => setCats((prev) => ({ ...prev, [c.key]: e.target.value }))}
                placeholder="One item per line"
                rows={3}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete entry</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
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
