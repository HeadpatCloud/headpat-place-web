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
) {
  return useQuery({
    ...orpc.storage.url.queryOptions({
      input: { kind, fileId: fileId ?? "" },
    }),
    enabled: !!fileId,
    staleTime: 4 * 60 * 1000,
  })
}

type StorageImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  kind: StorageKind
  fileId: string | null | undefined
  fallback?: React.ReactNode
}

export function StorageImage({
  kind,
  fileId,
  fallback,
  alt,
  ...imgProps
}: StorageImageProps) {
  const q = useStorageUrl(kind, fileId)
  if (!fileId || !q.data) return <>{fallback ?? null}</>
  return <img src={q.data.url} alt={alt ?? ""} {...imgProps} />
}
