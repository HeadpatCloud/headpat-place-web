import { ResponsiveImage } from "@/components/ResponsiveImage"
import type { StorageKind } from "@/components/StorageImage"

type Props = {
  kind: Extract<StorageKind, "banner" | "community-banner">
  fileId: string | null | undefined
  className?: string
  aspect?: "3/1"
}

export function GradientBanner({ kind, fileId, className, aspect }: Props) {
  const aspectClass = aspect === "3/1" ? "aspect-[3/1] w-full" : (className ?? "h-48 w-full")
  if (!fileId) {
    return <div className={`${aspectClass} bg-sunset`} />
  }
  return (
    <div className={`${aspectClass} overflow-hidden bg-muted`}>
      <ResponsiveImage
        kind={kind}
        fileId={fileId}
        sizes="100vw"
        className="h-full w-full object-cover"
        fallback={<div className="h-full w-full bg-sunset" />}
      />
    </div>
  )
}
