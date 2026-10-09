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
import { Badge } from "@/components/ui/badge";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { useDebounced } from "@/lib/use-debounced";

export const Route = createFileRoute("/{-$locale}/admin/events/")({
	component: EventsAdmin,
});

const pageSize = 20;
type Scope = "upcoming" | "past" | "all";

function EventsAdmin() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const [search, setSearch] = useState("");
	const [scope, setScope] = useState<Scope>("upcoming");
	const [page, setPage] = useState(1);
	const q = useDebounced(search);
	const list = useQuery({
		...orpc.adminContent.eventList.queryOptions({
			input: { search: q || undefined, scope, page, pageSize },
		}),
		placeholderData: keepPreviousData,
	});
	const remove = useMutation({
		mutationFn: (id: string) => client.adminContent.eventDelete({ id }),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			qc.invalidateQueries({ queryKey: orpc.adminContent.eventList.key() });
			qc.invalidateQueries({ queryKey: orpc.adminStats.overview.key() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<AdminPage title={t("eventsTitle")} description={t("eventsSubtitle")}>
			<div className="flex flex-wrap items-center gap-3">
				<SearchBox
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder={t("searchEvents")}
				/>
				<Chips
					value={scope}
					onChange={(v) => {
						setScope(v);
						setPage(1);
					}}
					options={[
						{ value: "upcoming", label: t("scopeUpcoming") },
						{ value: "past", label: t("scopePast") },
						{ value: "all", label: t("scopeAll") },
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
								<Th>{t("colEvent")}</Th>
								<Th>{t("colWhen")}</Th>
								<Th>{t("colPlace")}</Th>
								<Th>{t("colOrganizer")}</Th>
								<Th>{t("colVisibility")}</Th>
								<Th />
							</tr>
						</thead>
						<tbody>
							{list.data.items.map((e) => (
								<Tr key={e.id}>
									<Td>
										<Link
											to={`/events/${e.id}`}
											className="block max-w-64 truncate font-extrabold hover:underline"
										>
											{e.title}
										</Link>
										{e.communityName ? (
											<span className="text-xs font-semibold text-muted-foreground">
												{e.communityName}
											</span>
										) : null}
									</Td>
									<Td className="whitespace-nowrap">
										{fmt.dateTime(e.startsAt)}
									</Td>
									<Td className="max-w-48 truncate text-muted-foreground">
										{e.locationText ||
											(e.locationZoneMethod === "virtual" ? t("online") : "–")}
									</Td>
									<Td>
										{e.creatorUserId ? (
											<Link
												to={`/admin/users/${e.creatorUserId}`}
												className="font-semibold hover:underline"
											>
												{e.creatorName}
											</Link>
										) : (
											"–"
										)}
									</Td>
									<Td>
										<Badge variant={e.isPublic ? "outline" : "secondary"}>
											{e.isPublic ? t("public") : t("private")}
										</Badge>
									</Td>
									<Td className="text-right">
										<ConfirmDelete
											name={e.title}
											disabled={remove.isPending}
											onConfirm={() => remove.mutate(e.id)}
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
