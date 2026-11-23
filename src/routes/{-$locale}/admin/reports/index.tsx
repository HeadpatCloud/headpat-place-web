import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage, Empty } from "@/components/admin/AdminPage";
import { Chips } from "@/components/admin/Filters";
import { TableCard, Td, Th, Tr } from "@/components/admin/table";
import { Pager } from "@/components/Pager";
import { Badge } from "@/components/ui/badge";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/reports/")({
	component: ReportsList,
});

type Status = "" | "open" | "reviewing" | "resolved" | "dismissed";
type Assigned = "any" | "me" | "unassigned";
const pageSize = 25;

function ReportsList() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const [status, setStatus] = useState<Status>("open");
	const [assigned, setAssigned] = useState<Assigned>("any");
	const [page, setPage] = useState(1);
	const list = useQuery({
		...orpc.adminReport.list.queryOptions({
			input: { status: status || undefined, assigned, page, pageSize },
		}),
		placeholderData: keepPreviousData,
	});

	return (
		<AdminPage title={t("reports")} description={t("reportsSubtitle")}>
			<div className="flex flex-wrap gap-4">
				<Chips
					value={status}
					onChange={(v) => {
						setStatus(v);
						setPage(1);
					}}
					options={[
						{ value: "", label: c("all") },
						{ value: "open", label: t("filterOpen") },
						{ value: "reviewing", label: t("filterReviewing") },
						{ value: "resolved", label: t("filterResolved") },
						{ value: "dismissed", label: t("filterDismissed") },
					]}
				/>
				<Chips
					value={assigned}
					onChange={(v) => {
						setAssigned(v);
						setPage(1);
					}}
					options={[
						{ value: "any", label: t("assignedAny") },
						{ value: "me", label: t("assignedMe") },
						{ value: "unassigned", label: t("assignedNobody") },
					]}
				/>
			</div>

			{list.isError ? (
				<Empty>{t("noAccess")}</Empty>
			) : list.isPending ? (
				<Empty>{c("loading")}</Empty>
			) : list.data.items.length === 0 ? (
				<Empty>{t("noReports")}</Empty>
			) : (
				<>
					<TableCard>
						<thead>
							<tr>
								<Th>{t("reportWhat")}</Th>
								<Th>{t("reportReason")}</Th>
								<Th>{t("reportBy")}</Th>
								<Th>{t("reportAssignee")}</Th>
								<Th>{t("reportStatus")}</Th>
								<Th>{t("auditWhen")}</Th>
							</tr>
						</thead>
						<tbody>
							{list.data.items.map((r) => (
								<Tr key={r.id}>
									<Td>
										<Link
											to={`/admin/reports/${r.id}` as never}
											className="font-semibold hover:underline"
										>
											<span className="text-muted-foreground">
												{t(`targetType_${r.targetType}`)}
											</span>{" "}
											{r.target?.label ?? t("targetGone")}
										</Link>
									</Td>
									<Td className="max-w-72 truncate">{r.reason}</Td>
									<Td>{r.reporterName ?? "-"}</Td>
									<Td className="text-muted-foreground">
										{r.assigneeName ?? "-"}
									</Td>
									<Td>
										<Badge
											variant={
												r.status === "open"
													? "default"
													: r.status === "reviewing"
														? "outline"
														: "secondary"
											}
										>
											{t(`status_${r.status}`)}
										</Badge>
									</Td>
									<Td className="whitespace-nowrap text-muted-foreground">
										{fmt.dateTime(r.createdAt)}
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
