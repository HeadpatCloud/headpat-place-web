import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserCard, type UserSummary } from "@/components/UserCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/reports/")({
	component: ReportsList,
});

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

const filters: { labelKey: string | null; value: ReportStatus | undefined }[] =
	[
		{ labelKey: null, value: undefined },
		{ labelKey: "filterOpen", value: "open" },
		{ labelKey: "filterReviewing", value: "reviewing" },
		{ labelKey: "filterResolved", value: "resolved" },
		{ labelKey: "filterDismissed", value: "dismissed" },
	];

function ReportsList() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const fmt = useDateFormat();
	const [status, setStatus] = useState<ReportStatus | undefined>(undefined);
	const reports = useQuery(
		orpc.moderation.adminListReports.queryOptions({ input: { status } }),
	);

	const resolve = useMutation({
		mutationFn: (vars: {
			reportId: string;
			status: "resolved" | "dismissed";
		}) => client.moderation.adminResolveReport(vars),
		onSuccess: () =>
			qc.invalidateQueries({
				queryKey: orpc.moderation.adminListReports.key(),
			}),
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-extrabold tracking-tight">{t("reports")}</h1>
			<div className="flex flex-wrap gap-2">
				{filters.map((f) => (
					<Button
						key={f.value ?? "all"}
						size="sm"
						variant={status === f.value ? "default" : "outline"}
						className={
							status === f.value
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: ""
						}
						onClick={() => setStatus(f.value)}
					>
						{f.labelKey ? t(f.labelKey) : c("all")}
					</Button>
				))}
			</div>

			{reports.isError ? (
				<p className="text-muted-foreground">{t("noAccess")}</p>
			) : reports.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : (
				<div className="space-y-2">
					{(reports.data ?? []).map((r) => {
						const done = r.status === "resolved" || r.status === "dismissed";
						return (
							<Card key={r.id} className="space-y-3 p-3">
								<div className="flex items-center justify-between gap-2">
									<span className="text-sm font-semibold">
										<span className="text-muted-foreground capitalize">
											{r.targetType}
										</span>{" "}
										·{" "}
										{r.target?.href ? (
											<Link
												to={r.target.href as never}
												className="text-link hover:underline"
											>
												{r.target.label}
											</Link>
										) : (
											(r.target?.label ?? r.targetId)
										)}
									</span>
									<Badge variant={done ? "secondary" : "default"}>
										{r.status}
									</Badge>
								</div>
								{r.reporter ? (
									<UserCard user={r.reporter as UserSummary} />
								) : null}
								<p className="whitespace-pre-wrap text-sm">{r.reason}</p>
								<span className="text-xs text-muted-foreground">
									{fmt.dateTime(r.createdAt)}
								</span>
								{!done ? (
									<div className="flex gap-2">
										<Button
											size="sm"
											disabled={resolve.isPending}
											onClick={() =>
												resolve.mutate({ reportId: r.id, status: "resolved" })
											}
											className="bg-primary text-primary-foreground hover:bg-primary/90"
										>
											{t("resolve")}
										</Button>
										<Button
											size="sm"
											variant="outline"
											disabled={resolve.isPending}
											onClick={() =>
												resolve.mutate({ reportId: r.id, status: "dismissed" })
											}
										>
											{t("dismiss")}
										</Button>
									</div>
								) : null}
							</Card>
						);
					})}
					{(reports.data ?? []).length === 0 ? (
						<p className="text-muted-foreground text-sm">{t("noReports")}</p>
					) : null}
				</div>
			)}
		</div>
	);
}
