import { useQuery } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc"
import type { StorageKind } from "@/components/StorageImage"

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  kind: StorageKind
  fileId: string | null | undefined
  sizes: string
  fallback?: React.ReactNode
}

export function ResponsiveImage({ kind, fileId, sizes, fallback, alt, ...img }: Props) {
  const q = useQuery({
    ...orpc.storage.srcset.queryOptions({ input: { kind, fileId: fileId ?? "" } }),
    enabled: !!fileId,
    staleTime: 4 * 60 * 1000,
  })
  const sources = q.data?.sources ?? []
  if (!fileId || sources.length === 0) return <>{fallback ?? null}</>
  const srcSet = sources.map((s) => `${s.url} ${s.width}w`).join(", ")
  const largest = sources[sources.length - 1].url
  return <img src={largest} srcSet={srcSet} sizes={sizes} alt={alt ?? ""} {...img} />
}
