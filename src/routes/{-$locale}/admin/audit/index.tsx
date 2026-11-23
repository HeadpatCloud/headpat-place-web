import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DownloadIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { AdminPage, Empty } from "@/components/admin/AdminPage";
import { Chips, SearchBox } from "@/components/admin/Filters";
import { TableCard, Td, Th, Tr } from "@/components/admin/table";
import { Pager } from "@/components/Pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/lib/admin-access";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { useDebounced } from "@/lib/use-debounced";

export const Route = createFileRoute("/{-$locale}/admin/audit/")({
	component: AuditLog,
	validateSearch: (s: Record<string, unknown>): { user?: string } =>
		typeof s.user === "string" && s.user ? { user: s.user } : {},
});

const pageSize = 25;

function AuditLog() {
	const t = useTranslations("adminPanel");
	const [view, setView] = useState<"staff" | "account">("staff");
	return (
		<AdminPage title={t("auditTitle")} description={t("auditSubtitle")}>
			<Chips
				value={view}
				onChange={setView}
				options={[
					{ value: "staff", label: t("auditStaffTab") },
					{ value: "account", label: t("auditAccountTab") },
				]}
			/>
			{view === "staff" ? <StaffActions /> : <AccountEvents />}
		</AdminPage>
	);
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
	if (value === null || value === undefined) return null;
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs font-semibold text-muted-foreground">{label}</p>
			<pre className="max-h-64 overflow-auto text-xs">
				{JSON.stringify(value, null, 2)}
			</pre>
		</div>
	);
}

function StaffActions() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const { user: targetUserId } = Route.useSearch();
	const [search, setSearch] = useState("");
	const [kind, setKind] = useState<"" | "write" | "read">("");
	const [outcome, setOutcome] = useState<"" | "ok" | "error">("");
	const [page, setPage] = useState(1);
	const [open, setOpen] = useState<string | null>(null);
	const q = useDebounced(search);
	const { can } = useAdminAccess();
	const exporting = useMutation({
		mutationFn: () =>
			client.adminAudit.staffExport({
				search: q || undefined,
				kind: kind || undefined,
				outcome: outcome || undefined,
				targetUserId,
			}),
		onSuccess: (r) => {
			const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv" }));
			const a = document.createElement("a");
			a.href = url;
			a.download = `staff-audit-${new Date().toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
			if (r.truncated)
				toast.warning(t("auditExportTruncated", { count: r.rows }));
		},
		onError: (e: Error) => toast.error(e.message),
	});
	const list = useQuery({
		...orpc.adminAudit.staffList.queryOptions({
			input: {
				search: q || undefined,
				kind: kind || undefined,
				outcome: outcome || undefined,
				targetUserId,
				page,
				pageSize,
			},
		}),
		placeholderData: keepPreviousData,
	});

	return (
		<>
			<div className="space-y-3">
				<SearchBox
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder={t("auditStaffSearch")}
				/>
				<div className="flex flex-wrap gap-4">
					<Chips
						value={kind}
						onChange={(v) => {
							setKind(v);
							setPage(1);
						}}
						options={[
							{ value: "", label: t("auditKindAll") },
							{ value: "write", label: t("auditKindWrite") },
							{ value: "read", label: t("auditKindRead") },
						]}
					/>
					<Chips
						value={outcome}
						onChange={(v) => {
							setOutcome(v);
							setPage(1);
						}}
						options={[
							{ value: "", label: t("auditOutcomeAll") },
							{ value: "ok", label: t("auditOutcomeOk") },
							{ value: "error", label: t("auditOutcomeError") },
						]}
					/>
				</div>
				{can("audit:export") ? (
					<Button
						variant="outline"
						size="sm"
						disabled={exporting.isPending}
						onClick={() => exporting.mutate()}
					>
						<DownloadIcon className="size-4" />
						{t("auditExport")}
					</Button>
				) : null}
				{targetUserId ? (
					<p className="text-sm text-muted-foreground">
						{t("auditFilteredToUser")}{" "}
						<Link to="/admin/audit" className="font-semibold hover:underline">
							{t("auditClearFilter")}
						</Link>
					</p>
				) : null}
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
								<Th>{t("auditActor")}</Th>
								<Th>{t("auditAction")}</Th>
								<Th>{t("auditTarget")}</Th>
								<Th>{t("auditReason")}</Th>
							</tr>
						</thead>
						<tbody>
							{list.data.items.map((a) => (
								<Fragment key={a.id}>
									<Tr>
										<Td className="whitespace-nowrap text-muted-foreground">
											<button
												type="button"
												className="text-left hover:underline"
												aria-expanded={open === a.id}
												onClick={() => setOpen(open === a.id ? null : a.id)}
											>
												{fmt.dateTime(a.createdAt)}
											</button>
										</Td>
										<Td>
											<Link
												to={`/admin/users/${a.actorUserId}`}
												className="font-semibold hover:underline"
											>
												{a.actorName ?? a.actorUserId}
											</Link>
											{a.apiKeyId ? (
												<Badge variant="outline" className="ml-2">
													{t("auditViaKey")}
												</Badge>
											) : null}
										</Td>
										<Td>
											<div className="flex flex-wrap items-center gap-1.5">
												<span className="font-mono text-xs font-semibold">
													{a.procedure || a.permission}
												</span>
												{a.kind === "read" ? (
													<Badge variant="secondary">
														{t("auditKindRead")}
													</Badge>
												) : null}
												{a.outcome === "error" ? (
													<Badge variant="destructive">
														{t("auditOutcomeError")}
													</Badge>
												) : null}
											</div>
										</Td>
										<Td>
											{a.targetUserId ? (
												<Link
													to={`/admin/users/${a.targetUserId}`}
													className="font-semibold hover:underline"
												>
													{a.targetUserName ?? t("auditDeletedUser")}
												</Link>
											) : null}
											{a.targetType && a.targetType !== "user" ? (
												<span className="ml-1 font-mono text-xs text-muted-foreground">
													{a.targetType}:{a.targetId}
												</span>
											) : null}
										</Td>
										<Td className="max-w-64 truncate text-muted-foreground">
											{a.reason ?? ""}
										</Td>
									</Tr>
									{open === a.id ? (
										<tr>
											<td colSpan={5} className="bg-muted/30 px-4 py-3">
												<div className="grid gap-3 md:grid-cols-3">
													<JsonBlock label={t("auditInput")} value={a.input} />
													<JsonBlock
														label={t("auditBefore")}
														value={a.before}
													/>
													<JsonBlock label={t("auditAfter")} value={a.after} />
												</div>
												<p className="mt-2 text-xs text-muted-foreground">
													{a.permission} · {a.ipAddress ?? "-"} ·{" "}
													{a.userAgent ?? "-"}
													{a.error ? ` · ${a.error}` : ""}
												</p>
											</td>
										</tr>
									) : null}
								</Fragment>
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
		</>
	);
}

function AccountEvents() {
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
		<>
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
		</>
	);
}
