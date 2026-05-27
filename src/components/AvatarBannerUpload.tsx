import { useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { StorageImage, type StorageKind } from "@/components/StorageImage"
import { Button } from "@/components/ui/button"
import { client } from "@/lib/orpc"

function makeFileId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20)
}

type Props = {
  kind: Extract<StorageKind, "avatar" | "banner">
  currentFileId: string | null | undefined
  /** Receives the new fileId after successful upload. */
  onUploaded: (fileId: string) => Promise<void> | void
  aspect?: "square" | "wide"
}

export function AvatarBannerUpload({
  kind,
  currentFileId,
  onUploaded,
  aspect = kind === "avatar" ? "square" : "wide",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const onPick = async (file: File) => {
    setBusy(true)
    try {
      const fileId = makeFileId()
      const { uploadUrl } = await client.storage.uploadInit({
        kind,
        fileId,
        contentType: file.type || "application/octet-stream",
      })
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!put.ok) throw new Error(`S3 upload failed: ${put.status}`)
      await onUploaded(fileId)
      await queryClient.invalidateQueries({ queryKey: ["storage", "url"] })
      toast.success(`${kind} updated`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={
          aspect === "square"
            ? "h-32 w-32 overflow-hidden rounded-full bg-muted"
            : "h-32 w-full overflow-hidden rounded-md bg-muted"
        }
      >
        <StorageImage
          kind={kind}
          fileId={currentFileId}
          alt={kind}
          className="h-full w-full object-cover"
          fallback={null}
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : `Change ${kind}`}
      </Button>
    </div>
  )
}
