import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage, Empty } from "@/components/admin/AdminPage";
import { Chips, SearchBox } from "@/components/admin/Filters";
import { TableCard, Td, Th, Tr } from "@/components/admin/table";
import { Pager } from "@/components/Pager";
import { Badge } from "@/components/ui/badge";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { useDebounced } from "@/lib/use-debounced";

export const Route = createFileRoute("/{-$locale}/admin/audit/")({
	component: AuditLog,
});

const pageSize = 25;

function AuditLog() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [page, setPage] = useState(1);
	const q = useDebounced(search);
	const categories = useQuery(
		orpc.adminAudit.categories.queryOptions({ input: undefined }),
	);
	const list = useQuery({
		...orpc.adminAudit.list.queryOptions({
			input: {
				search: q || undefined,
				category: category || undefined,
				page,
				pageSize,
			},
		}),
		placeholderData: keepPreviousData,
	});

	return (
		<AdminPage title={t("auditTitle")} description={t("auditSubtitle")}>
			<div className="space-y-3">
				<SearchBox
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder={t("auditSearch")}
				/>
				<Chips
					value={category}
					onChange={(v) => {
						setCategory(v);
						setPage(1);
					}}
					options={[
						{ value: "", label: t("auditAllCategories") },
						...(categories.data ?? []).map((cat) => ({
							value: cat,
							label: cat,
						})),
					]}
				/>
			</div>

			{list.isError ? (
				<Empty>{t("noAccess")}</Empty>
			) : list.isPending ? (
				<Empty>{c("loading")}</Empty>
			) : list.data.items.length === 0 ? (
				<Empty>{t("auditEmpty")}</Empty>
			) : (
				<>
					<TableCard>
						<thead>
							<tr>
								<Th>{t("auditWhen")}</Th>
								<Th>{t("auditAction")}</Th>
								<Th>{t("auditAccount")}</Th>
								<Th>{t("auditActor")}</Th>
							</tr>
						</thead>
						<tbody>
							{list.data.items.map((a) => (
								<Tr key={a.id}>
									<Td className="whitespace-nowrap text-muted-foreground">
										{fmt.dateTime(a.createdAt)}
									</Td>
									<Td>
										<div className="flex items-center gap-2">
											<Badge variant="outline">{a.category}</Badge>
											<span className="font-mono text-xs font-semibold">
												{a.action}
											</span>
										</div>
									</Td>
									<Td>
										<Link
											to={`/admin/users/${a.userId}`}
											className="font-semibold hover:underline"
										>
											{a.userName}
										</Link>
									</Td>
									<Td>
										{a.actorUserId ? (
											<Link
												to={`/admin/users/${a.actorUserId}`}
												className="font-semibold hover:underline"
											>
												{a.actorName}
											</Link>
										) : (
											<span className="text-muted-foreground">
												{t("auditSystem")}
											</span>
										)}
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
