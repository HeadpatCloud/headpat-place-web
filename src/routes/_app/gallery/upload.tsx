import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import InputField from "@/components/fields/InputField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormField } from "@/components/ui/form"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/gallery/upload")({
  component: UploadPage,
})

const schema = z.object({
  name: z.string().min(1).max(200),
  longText: z.string().max(10000).optional(),
  nsfw: z.boolean().optional(),
  tags: z.string().optional(),
})

function makeFileId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20)
}

const MIME_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "video/mp4": "MP4",
  "video/webm": "WebM",
  "video/quicktime": "MOV",
}

function mimeLabel(mime: string): string {
  return MIME_LABELS[mime] ?? mime.split("/")[1]?.toUpperCase() ?? mime
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const mb = bytes / (1024 * 1024)
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`
}

function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>("")

  const policy = useQuery(orpc.storage.policy.queryOptions({ input: undefined }))
  const isVideo = file?.type.startsWith("video/") ?? false

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  function pickFile(f: File | null) {
    if (f && policy.data) {
      if (!policy.data.allowedMime.includes(f.type)) {
        toast.error(`${f.type || "This file type"} isn't allowed.`)
        return
      }
      if (f.size > policy.data.maxBytes) {
        toast.error(`File is too large (max ${formatBytes(policy.data.maxBytes)}).`)
        return
      }
    }
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return f ? URL.createObjectURL(f) : null
    })
    setFile(f)
  }

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", longText: "", nsfw: false, tags: "" },
  })

  const submit = useMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      if (!file) throw new Error("Pick a file first")
      const fileId = makeFileId()

      setProgress("Requesting upload URL…")
      const { uploadUrl } = await client.storage.uploadInit({
        kind: "gallery",
        fileId,
        contentType: file.type || "application/octet-stream",
      })

      setProgress("Uploading to S3…")
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!put.ok) throw new Error(`S3 upload failed: ${put.status}`)

      await client.storage.finalize({ kind: "gallery", fileId })

      setProgress("Saving metadata…")
      const g = await client.gallery.create({
        name: v.name,
        longText: v.longText || undefined,
        nsfw: v.nsfw ?? false,
        tags: v.tags ? v.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        fileId,
      })
      return g
    },
    onSuccess: (g) => {
      toast.success("Uploaded.")
      navigate({ to: `/gallery/${g.id}` as never })
    },
    onError: (e: Error) => {
      setProgress("")
      toast.error(e.message)
    },
  })

  return (
    <main className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload to gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => submit.mutate(v))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium">Media file</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input p-8 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {previewUrl ? (
                    isVideo ? (
                      <video src={previewUrl} className="max-h-48 rounded-lg" controls muted />
                    ) : (
                      <img src={previewUrl} alt="preview" className="max-h-48 rounded-lg object-contain" />
                    )
                  ) : (
                    <span className="text-muted-foreground text-sm">Click to choose a file</span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={policy.data?.allowedMime.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0] ?? null)
                    e.target.value = ""
                  }}
                />
                {policy.data ? (
                  <p className="text-xs text-muted-foreground">
                    Allowed: {policy.data.allowedMime.map(mimeLabel).join(", ")} · max{" "}
                    {formatBytes(policy.data.maxBytes)}
                  </p>
                ) : null}
                {file ? (
                  <p className="text-xs text-muted-foreground">
                    {file.name} — {formatBytes(file.size)}
                  </p>
                ) : null}
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <InputField label="Title" description="" placeholder="" field={field} />
                )}
              />
              <FormField
                control={form.control}
                name="longText"
                render={({ field }) => (
                  <InputField label="Description" description="" placeholder="" field={field} />
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <InputField
                    label="Tags (comma-separated)"
                    description=""
                    placeholder="art, ref"
                    field={field}
                  />
                )}
              />
              {progress ? (
                <p className="text-sm text-muted-foreground">{progress}</p>
              ) : null}
              <Button type="submit" disabled={submit.isPending || !file} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {submit.isPending ? "Uploading…" : "Upload"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
