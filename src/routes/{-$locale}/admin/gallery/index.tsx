import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage, Empty } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { Chips, SearchBox } from "@/components/admin/Filters";
import { TableCard, Td, Th, Tr } from "@/components/admin/table";
import { Pager } from "@/components/Pager";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { useDebounced } from "@/lib/use-debounced";

export const Route = createFileRoute("/{-$locale}/admin/gallery/")({
	component: GalleryModeration,
});

const pageSize = 20;
type Filter = "all" | "nsfw" | "safe";

function GalleryModeration() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<Filter>("all");
	const [page, setPage] = useState(1);
	const q = useDebounced(search);
	const list = useQuery({
		...orpc.adminContent.galleryList.queryOptions({
			input: {
				search: q || undefined,
				nsfw: filter === "all" ? undefined : filter === "nsfw",
				page,
				pageSize,
			},
		}),
		placeholderData: keepPreviousData,
	});
	const remove = useMutation({
		mutationFn: (id: string) => client.adminContent.galleryDelete({ id }),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			qc.invalidateQueries({ queryKey: orpc.adminContent.galleryList.key() });
			qc.invalidateQueries({ queryKey: orpc.adminStats.overview.key() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<AdminPage title={t("galleryTitle")} description={t("gallerySubtitle")}>
			<div className="flex flex-wrap items-center gap-3">
				<SearchBox
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder={t("searchGallery")}
				/>
				<Chips
					value={filter}
					onChange={(v) => {
						setFilter(v);
						setPage(1);
					}}
					options={[
						{ value: "all", label: t("filterAll") },
						{ value: "safe", label: t("filterSafe") },
						{ value: "nsfw", label: t("filterNsfw") },
					]}
				/>
			</div>

			{list.isError ? (
				<Empty>{t("noAccess")}</Empty>
			) : list.isPending ? (
				<Empty>{c("loading")}</Empty>
			) : list.data.items.length === 0 ? (
				<Empty>{t("nothingYet")}</Empty>
			) : (
				<>
					<TableCard>
						<thead>
							<tr>
								<Th>{t("colItem")}</Th>
								<Th>{t("colOwner")}</Th>
								<Th>{t("colUploaded")}</Th>
								<Th>{t("colLikes")}</Th>
								<Th />
							</tr>
						</thead>
						<tbody>
							{list.data.items.map((g) => (
								<Tr key={g.id}>
									<Td>
										<Link
											to={`/gallery/${g.id}`}
											className="flex items-center gap-3"
										>
											<span className="size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
												<ResponsiveImage
													kind="gallery"
													fileId={g.fileId}
													alt={g.name}
													sizes="56px"
													className="size-full object-cover"
												/>
											</span>
											<span className="min-w-0">
												<span className="block truncate font-extrabold">
													{g.name}
												</span>
												{g.nsfw ? (
													<Badge variant="destructive">{t("filterNsfw")}</Badge>
												) : null}
											</span>
										</Link>
									</Td>
									<Td>
										<Link
											to={`/admin/users/${g.userId}`}
											className="font-semibold hover:underline"
										>
											{g.ownerName}
										</Link>
									</Td>
									<Td className="whitespace-nowrap text-muted-foreground">
										{fmt.dateTime(g.createdAt)}
									</Td>
									<Td className="tabular-nums">
										{g.likesCount} / {g.commentsCount}
									</Td>
									<Td className="text-right">
										<ConfirmDelete
											name={g.name}
											disabled={remove.isPending}
											onConfirm={() => remove.mutate(g.id)}
										/>
									</Td>
								</Tr>
							))}
						</tbody>
					</TableCard>
					<Pager
						page={list.data.page}
						total={list.data.total}
						pageSize={list.data.pageSize}
						onPageChange={setPage}
					/>
				</>
			)}
		</AdminPage>
	);
}
