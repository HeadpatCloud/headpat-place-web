import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { orpc } from "@/lib/orpc";

export type StorageKind =
	| "gallery"
	| "avatar"
	| "banner"
	| "community-avatar"
	| "community-banner";

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
	});
}

type StorageImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
	kind: StorageKind;
	fileId: string | null | undefined;
	fallback?: React.ReactNode;
	variant?: string;
};

export function StorageImage({
	kind,
	fileId,
	fallback,
	alt,
	variant,
	...imgProps
}: StorageImageProps) {
	const q = useStorageUrl(kind, fileId, variant);
	const [errored, setErrored] = useState(false);
	const url = q.data?.url;
	// Reset when the resolved URL changes (e.g. the fileId changed) so a new
	// image is attempted instead of staying on the previous error.
	useEffect(() => {
		setErrored(false);
	}, [url]);
	if (!fileId || !url || errored) return <>{fallback ?? null}</>;
	return (
		<img
			src={url}
			alt={alt ?? ""}
			{...imgProps}
			onError={() => setErrored(true)}
		/>
	);
}
