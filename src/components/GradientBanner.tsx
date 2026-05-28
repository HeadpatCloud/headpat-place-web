import { useStorageUrl, type StorageKind } from "@/components/StorageImage"

type Props = {
  kind: Extract<StorageKind, "banner" | "community-banner">
  fileId: string | null | undefined
  className?: string
}

export function GradientBanner({ kind, fileId, className }: Props) {
  const q = useStorageUrl(kind, fileId)
  const base = className ?? "h-48 w-full rounded-lg"
  if (fileId && q.data) {
    return (
      <div
        className={`${base} bg-cover bg-center bg-muted`}
        style={{ backgroundImage: `url(${q.data.url})` }}
      />
    )
  }
  return <div className={`${base} bg-sunset`} />
}
