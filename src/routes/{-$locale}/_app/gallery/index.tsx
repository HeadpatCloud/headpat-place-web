import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pager } from "@/components/Pager";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/auth-client";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useTranslations,
} from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

const SKELETON_HEIGHTS = [
	"h-44",
	"h-60",
	"h-52",
	"h-40",
	"h-56",
	"h-48",
	"h-64",
	"h-44",
	"h-56",
	"h-48",
	"h-60",
	"h-52",
];

export const Route = createFileRoute("/{-$locale}/_app/gallery/")({
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "galleryPages.title"),
			path: "/gallery",
			locale,
		});
	},
	component: GalleryPage,
});

const PAGE_SIZE = 24;

function GalleryPage() {
	const t = useTranslations("galleryPages");
	const { data: session } = useSession();
	const [page, setPage] = useState(1);
	const query = useQuery(
		orpc.gallery.list.queryOptions({ input: { page, pageSize: PAGE_SIZE } }),
	);

	const profileQuery = useQuery({
		...orpc.profile.me.queryOptions({ input: undefined }),
		enabled: !!session?.user,
	});
	const nsfwEnabled = Boolean(
		(profileQuery.data as { nsfwEnabled?: boolean } | undefined)?.nsfwEnabled,
	);

	// per-device gallery NSFW toggle, only shown when the account allows NSFW
	const [showNsfw, setShowNsfw] = useState(true);
	useEffect(() => {
		setShowNsfw(localStorage.getItem("gallery:showNsfw") !== "false");
	}, []);
	function toggleNsfw(v: boolean) {
		setShowNsfw(v);
		localStorage.setItem("gallery:showNsfw", String(v));
	}

	const hideNsfw = nsfwEnabled && !showNsfw;
	const items = (query.data?.items ?? []).filter((g) => !hideNsfw || !g.nsfw);

	return (
		<main className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-2xl font-bold">{t("title")}</h2>
				<div className="flex items-center gap-4">
					{nsfwEnabled ? (
						<div className="flex items-center gap-2">
							<Switch
								id="gallery-nsfw"
								checked={showNsfw}
								onCheckedChange={toggleNsfw}
							/>
							<Label
								htmlFor="gallery-nsfw"
								className="cursor-pointer select-none text-sm text-muted-foreground"
							>
								{t("showNsfw")}
							</Label>
						</div>
					) : null}
					<Button asChild>
						<Link to={"/gallery/upload" as never}>{t("upload")}</Link>
					</Button>
				</div>
			</div>
			{query.isPending ? (
				<div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
					{SKELETON_HEIGHTS.map((h, i) => (
						<Skeleton key={i} className={cn("w-full rounded-xl", h)} />
					))}
				</div>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">{t("empty")}</p>
			) : (
				<>
					<div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
						{items.map((g) => (
							<Link
								key={g.id}
								to={`/gallery/${g.id}` as never}
								className="group zoom-parent block break-inside-avoid overflow-hidden rounded-xl relative"
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
								<div className="pointer-events-none absolute inset-x-2 bottom-2 translate-y-1 rounded-lg border border-white/20 bg-black/40 px-3 py-2 opacity-0 shadow-lg backdrop-blur-md transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none">
									<p className="truncate text-sm font-semibold text-white">
										{g.name}
									</p>
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
