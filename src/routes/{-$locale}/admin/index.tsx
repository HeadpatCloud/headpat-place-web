import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	BadgeHelpIcon,
	CalendarIcon,
	FileCheckIcon,
	HeartHandshakeIcon,
	LayoutPanelLeftIcon,
	MailWarningIcon,
	UserPlusIcon,
	UsersIcon,
	UserXIcon,
} from "lucide-react";
import { AdminPage, Empty, Panel } from "@/components/admin/AdminPage";
import { BarChart } from "@/components/admin/BarChart";
import { StatCard } from "@/components/admin/StatCard";
import { StorageImage } from "@/components/StorageImage";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/")({
	component: AdminOverview,
});

function formatUptime(sec: number) {
	const d = Math.floor(sec / 86400);
	const h = Math.floor((sec % 86400) / 3600);
	const m = Math.floor((sec % 3600) / 60);
	return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function AdminOverview() {
	const t = useTranslations("adminPanel");
	const fmt = useDateFormat();
	const stats = useQuery(
		orpc.adminStats.overview.queryOptions({ input: undefined }),
	);
	const system = useQuery(
		orpc.adminStats.system.queryOptions({ input: undefined }),
	);
	const totals = stats.data?.totals;
	const forbidden = stats.isError;

	return (
		<AdminPage title={t("dashboardTitle")} description={t("dashboardSubtitle")}>
			{forbidden ? (
				<Empty>{t("noAccess")}</Empty>
			) : (
				<>
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
						<StatCard
							label={t("statUsers")}
							value={totals?.users}
							icon={UsersIcon}
							to="/admin/users"
						/>
						<StatCard
							label={t("statNewWeek")}
							value={totals?.newThisWeek}
							icon={UserPlusIcon}
							tint="bg-accent/20"
						/>
						<StatCard
							label={t("statGallery")}
							value={totals?.gallery}
							icon={LayoutPanelLeftIcon}
							to="/admin/gallery"
						/>
						<StatCard
							label={t("statCommunities")}
							value={totals?.communities}
							icon={HeartHandshakeIcon}
							tint="bg-accent/20"
							to="/admin/communities"
						/>
						<StatCard
							label={t("statEvents")}
							value={totals?.upcomingEvents}
							icon={CalendarIcon}
							tint="bg-muted"
							to="/admin/events"
						/>
						<StatCard
							label={t("statReports")}
							value={totals?.openReports}
							icon={FileCheckIcon}
							tint="bg-destructive/10"
							to="/admin/reports"
							alert={(totals?.openReports ?? 0) > 0}
						/>
						<StatCard
							label={t("statTickets")}
							value={totals?.openTickets}
							icon={BadgeHelpIcon}
							tint="bg-destructive/10"
							to="/admin/tickets"
							alert={(totals?.openTickets ?? 0) > 0}
						/>
						<StatCard
							label={t("statBanned")}
							value={totals?.banned}
							icon={UserXIcon}
							tint="bg-muted"
							to="/admin/users"
						/>
						<StatCard
							label={t("statUnverified")}
							value={totals?.unverified}
							icon={MailWarningIcon}
							tint="bg-muted"
							to="/admin/users"
						/>
					</div>

					<div className="grid gap-5 lg:grid-cols-2">
						<Panel title={t("signupsTitle")}>
							{stats.data ? (
								<BarChart data={stats.data.signups} label={t("signupsTitle")} />
							) : null}
						</Panel>
						<Panel title={t("uploadsTitle")}>
							{stats.data ? (
								<BarChart data={stats.data.uploads} label={t("uploadsTitle")} />
							) : null}
						</Panel>
					</div>

					<div className="grid gap-5 lg:grid-cols-3">
						<Panel
							title={t("latestUsers")}
							className="lg:col-span-1"
							action={
								<Link
									to="/admin/users"
									className="text-sm font-extrabold text-link hover:underline"
								>
									{t("viewAll")}
								</Link>
							}
						>
							{stats.data?.latestUsers.length ? (
								<ul className="space-y-1">
									{stats.data.latestUsers.map((u) => (
										<li key={u.userId}>
											<Link
												to={`/admin/users/${u.userId}`}
												className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted"
											>
												<StorageImage
													kind="avatar"
													fileId={u.avatarFileId}
													variant="sm"
													className="size-10 shrink-0 rounded-full bg-muted object-cover"
													fallback={
														<span className="size-10 shrink-0 rounded-full bg-muted" />
													}
												/>
												<span className="min-w-0">
													<span className="block truncate font-extrabold">
														{u.name}
													</span>
													<span className="block text-xs font-semibold text-muted-foreground">
														{fmt.dateTime(u.createdAt)}
													</span>
												</span>
											</Link>
										</li>
									))}
								</ul>
							) : (
								<Empty>{t("nothingYet")}</Empty>
							)}
						</Panel>

						<Panel
							title={t("reportsWaiting")}
							className="lg:col-span-1"
							action={
								<Link
									to="/admin/reports"
									className="text-sm font-extrabold text-link hover:underline"
								>
									{t("viewAll")}
								</Link>
							}
						>
							{stats.data?.latestReports.length ? (
								<ul className="space-y-2">
									{stats.data.latestReports.map((r) => (
										<li
											key={r.id}
											className="rounded-2xl bg-destructive/10 p-3 text-sm"
										>
											<span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
												{r.targetType}
											</span>
											<p className="line-clamp-2 font-semibold">{r.reason}</p>
										</li>
									))}
								</ul>
							) : (
								<Empty>{t("nothingYet")}</Empty>
							)}
						</Panel>

						<Panel title={t("systemTitle")} className="lg:col-span-1">
							{system.data ? (
								<dl className="grid grid-cols-2 gap-3 text-sm">
									{(
										[
											[t("sysVersion"), system.data.version],
											[t("sysUptime"), formatUptime(system.data.uptimeSec)],
											[t("sysDb"), `${system.data.dbLatencyMs} ms`],
											[t("sysMemory"), `${system.data.memoryMb} MB`],
											[t("sysRuntime"), system.data.runtime],
										] as const
									).map(([k, v]) => (
										<div key={k} className="rounded-2xl bg-muted/50 p-3">
											<dt className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
												{k}
											</dt>
											<dd className="mt-1 font-display text-base font-semibold">
												{v}
											</dd>
										</div>
									))}
								</dl>
							) : (
								<Empty>{t("nothingYet")}</Empty>
							)}
						</Panel>
					</div>
				</>
			)}
		</AdminPage>
	);
}
