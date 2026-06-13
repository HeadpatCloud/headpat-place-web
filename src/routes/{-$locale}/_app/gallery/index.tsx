import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pager } from "@/components/Pager";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/gallery/")({
	component: GalleryPage,
});

const PAGE_SIZE = 24;

function GalleryPage() {
	const t = useTranslations("galleryPages");
	const c = useTranslations("common");
	const [page, setPage] = useState(1);
	const query = useQuery(
		orpc.gallery.list.queryOptions({ input: { page, pageSize: PAGE_SIZE } }),
	);
	const items = query.data?.items ?? [];

	return (
		<main className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">{t("title")}</h2>
				<Button asChild>
					<Link to={"/gallery/upload" as never}>{t("upload")}</Link>
				</Button>
			</div>
			{query.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">{t("empty")}</p>
			) : (
				<>
					<div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
						{items.map((g) => (
							<Link
								key={g.id}
								to={`/gallery/${g.id}` as never}
								className="zoom-parent block break-inside-avoid overflow-hidden rounded-xl relative"
							>
								<ResponsiveImage
									kind="gallery"
									fileId={g.fileId}
									alt={g.name}
									sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
									className="zoom-img w-full"
									fallback={<div className="aspect-square w-full bg-muted" />}
								/>
								{g.nsfw ? (
									<span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs text-white">
										NSFW
									</span>
								) : null}
								<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
									<p className="truncate font-semibold text-white">{g.name}</p>
								</div>
							</Link>
						))}
					</div>
					<Pager
						page={page}
						total={query.data?.total ?? 0}
						pageSize={PAGE_SIZE}
						onPageChange={setPage}
					/>
				</>
			)}
		</main>
	);
}
