import { useQuery } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc"

export type StorageKind =
  | "gallery"
  | "avatar"
  | "banner"
  | "community-avatar"
  | "community-banner"

export function useStorageUrl(
  kind: StorageKind,
  fileId: string | null | undefined,
  variant?: string,
) {
  return useQuery({
    ...orpc.storage.url.queryOptions({
      input: { kind, fileId: fileId ?? "", variant },
    }),
    enabled: !!fileId,
    staleTime: 4 * 60 * 1000,
  })
}

type StorageImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  kind: StorageKind
  fileId: string | null | undefined
  fallback?: React.ReactNode
  variant?: string
}

export function StorageImage({
  kind,
  fileId,
  fallback,
  alt,
  variant,
  ...imgProps
}: StorageImageProps) {
  const q = useStorageUrl(kind, fileId, variant)
  if (!fileId || !q.data) return <>{fallback ?? null}</>
  return <img src={q.data.url} alt={alt ?? ""} {...imgProps} />
}
