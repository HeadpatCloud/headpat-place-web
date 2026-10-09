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
import { SearchBox } from "@/components/admin/Filters";
import { TableCard, Td, Th, Tr } from "@/components/admin/table";
import { Pager } from "@/components/Pager";
import { StorageImage } from "@/components/StorageImage";
import { Badge } from "@/components/ui/badge";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { useDebounced } from "@/lib/use-debounced";

export const Route = createFileRoute("/{-$locale}/admin/communities/")({
	component: CommunitiesAdmin,
});

const pageSize = 20;

function CommunitiesAdmin() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const q = useDebounced(search);
	const list = useQuery({
		...orpc.adminContent.communityList.queryOptions({
			input: { search: q || undefined, page, pageSize },
		}),
		placeholderData: keepPreviousData,
	});
	const remove = useMutation({
		mutationFn: (id: string) => client.adminContent.communityDelete({ id }),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			qc.invalidateQueries({ queryKey: orpc.adminContent.communityList.key() });
			qc.invalidateQueries({ queryKey: orpc.adminStats.overview.key() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<AdminPage
			title={t("communitiesTitle")}
			description={t("communitiesSubtitle")}
		>
			<SearchBox
				value={search}
				onChange={(v) => {
					setSearch(v);
					setPage(1);
				}}
				placeholder={t("searchCommunities")}
			/>

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
								<Th>{t("colCommunity")}</Th>
								<Th>{t("colFollowers")}</Th>
								<Th>{t("colVisibility")}</Th>
								<Th>{t("colCreated")}</Th>
								<Th />
							</tr>
						</thead>
						<tbody>
							{list.data.items.map((x) => (
								<Tr key={x.id}>
									<Td>
										<Link
											to={`/community/${x.id}`}
											className="flex items-center gap-3"
										>
											<StorageImage
												kind="community-avatar"
												fileId={x.avatarFileId}
												variant="sm"
												className="size-11 shrink-0 rounded-2xl bg-muted object-cover"
												fallback={
													<span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary font-display font-semibold text-primary-foreground">
														{x.name.charAt(0).toUpperCase()}
													</span>
												}
											/>
											<span className="min-w-0">
												<span className="block truncate font-extrabold">
													{x.name}
												</span>
												<span className="block text-xs font-semibold text-muted-foreground">
													/{x.slug}
												</span>
											</span>
										</Link>
									</Td>
									<Td className="tabular-nums">{x.followersCount}</Td>
									<Td>
										<div className="flex flex-wrap gap-1.5">
											{x.isFindable === false ? (
												<Badge variant="secondary">{t("hidden")}</Badge>
											) : (
												<Badge variant="outline">{t("public")}</Badge>
											)}
											{x.nsfw ? (
												<Badge variant="destructive">{t("filterNsfw")}</Badge>
											) : null}
										</div>
									</Td>
									<Td className="whitespace-nowrap text-muted-foreground">
										{fmt.date(x.createdAt)}
									</Td>
									<Td className="text-right">
										<ConfirmDelete
											name={x.name}
											disabled={remove.isPending}
											onConfirm={() => remove.mutate(x.id)}
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
