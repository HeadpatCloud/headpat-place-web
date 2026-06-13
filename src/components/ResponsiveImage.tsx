import { useQuery } from "@tanstack/react-query";
import { StorageImage, type StorageKind } from "@/components/StorageImage";
import { orpc } from "@/lib/orpc";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
	kind: StorageKind;
	fileId: string | null | undefined;
	sizes: string;
	fallback?: React.ReactNode;
};

export function ResponsiveImage({
	kind,
	fileId,
	sizes,
	fallback,
	alt,
	...img
}: Props) {
	const q = useQuery({
		...orpc.storage.srcset.queryOptions({
			input: { kind, fileId: fileId ?? "" },
		}),
		enabled: !!fileId,
		staleTime: 4 * 60 * 1000,
	});
	if (!fileId) return <>{fallback ?? null}</>;
	const sources = q.data?.sources ?? [];
	// No generated variants (animated GIFs are never flattened to a static webp) —
	// serve the original so animation and full quality are preserved.
	if (sources.length === 0) {
		if (q.isPending) return <>{fallback ?? null}</>;
		return (
			<StorageImage
				kind={kind}
				fileId={fileId}
				alt={alt}
				fallback={fallback}
				{...img}
			/>
		);
	}
	const srcSet = sources.map((s) => `${s.url} ${s.width}w`).join(", ");
	const largest = sources[sources.length - 1].url;
	return (
		<img src={largest} srcSet={srcSet} sizes={sizes} alt={alt ?? ""} {...img} />
	);
}
