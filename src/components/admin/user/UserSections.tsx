import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ActivityIcon,
	MapPinIcon,
	MapPinOffIcon,
	SmartphoneIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ReasonConfirm } from "@/components/admin/ReasonConfirm";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-xl border border-border p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="font-display text-xl font-semibold tabular-nums">{value}</p>
		</div>
	);
}

/** What the user owns and takes part in, with links into the admin pages. */
export function UserActivity({ userId }: { userId: string }) {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const q = useQuery(
		orpc.adminUser.activity.queryOptions({ input: { userId } }),
	);
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ActivityIcon className="size-4" />
					{t("activityTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{q.isPending ? (
					<p className="text-sm text-muted-foreground">{c("loading")}</p>
				) : q.isError ? (
					<p className="text-sm text-muted-foreground">{t("noAccess")}</p>
				) : (
					<>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
							<Stat label={t("statGallery")} value={q.data.gallery.total} />
							<Stat
								label={t("statEventsCreated")}
								value={q.data.events.createdTotal}
							/>
							<Stat label={t("statBlocking")} value={q.data.blocks.blocking} />
							<Stat
								label={t("statBlockedBy")}
								value={q.data.blocks.blockedBy}
							/>
						</div>

						{q.data.gallery.latest.length ? (
							<div className="space-y-2">
								<p className="text-sm font-medium">{t("statGallery")}</p>
								<div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
									{q.data.gallery.latest.map((g) => (
										<Link
											key={g.id}
											to={`/admin/gallery/${g.id}` as never}
											className="relative aspect-square overflow-hidden rounded-xl bg-muted"
											title={g.name}
										>
											<ResponsiveImage
												kind="gallery"
												fileId={g.fileId}
												alt={g.name}
												sizes="96px"
												className="size-full object-cover"
											/>
											{g.nsfw ? (
												<Badge
													variant="destructive"
													className="absolute left-1 top-1"
												>
													18+
												</Badge>
											) : null}
										</Link>
									))}
								</div>
							</div>
						) : null}

						{q.data.communities.length ? (
							<div className="space-y-2">
								<p className="text-sm font-medium">
									{t("activityCommunities")}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{q.data.communities.map((cm) => (
										<Badge key={cm.id} variant="secondary">
											{cm.name} · {cm.role}
										</Badge>
									))}
								</div>
							</div>
						) : null}

						{q.data.events.created.length ? (
							<div className="space-y-1">
								<p className="text-sm font-medium">{t("statEventsCreated")}</p>
								{q.data.events.created.map((e) => (
									<p key={e.id} className="text-sm">
										<Link
											to={`/events/${e.id}` as never}
											className="hover:underline"
										>
											{e.title}
										</Link>{" "}
										<span className="text-muted-foreground">
											· {fmt.date(e.startsAt)}
										</span>
									</p>
								))}
							</div>
						) : null}

						<div className="space-y-1">
							<p className="text-sm font-medium">
								{t("reportsAgainst")}{" "}
								<span className="text-muted-foreground">
									· {t("reportsFiled", { count: q.data.reports.filed })}
								</span>
							</p>
							{q.data.reports.against.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{t("noReports")}
								</p>
							) : (
								q.data.reports.against.map((r) => (
									<Link
										key={r.id}
										to={`/admin/reports/${r.id}` as never}
										className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/40"
									>
										<span className="min-w-0 truncate">{r.reason}</span>
										<Badge variant="secondary">{t(`status_${r.status}`)}</Badge>
									</Link>
								))
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}

/** Push devices. Platform and dates only. */
export function UserDevices({ userId }: { userId: string }) {
	const t = useTranslations("adminPanel");
	const fmt = useDateFormat();
	const q = useQuery(
		orpc.adminUser.devices.queryOptions({ input: { userId } }),
	);
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SmartphoneIcon className="size-4" />
					{t("devicesTitle")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{(q.data ?? []).length === 0 ? (
					<p className="text-sm text-muted-foreground">{t("devicesNone")}</p>
				) : (
					(q.data ?? []).map((d) => (
						<div
							key={d.id}
							className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5 text-sm"
						>
							<span className="font-medium capitalize">{d.platform}</span>
							<span className="text-xs text-muted-foreground">
								{t("devicesLastSeen", { date: fmt.date(d.updatedAt) })}
							</span>
						</div>
					))
				)}
			</CardContent>
		</Card>
	);
}

/** Location sharing and who's around, without coordinates. */
export function UserLocation({
	userId,
	canRevoke,
}: {
	userId: string;
	canRevoke: boolean;
}) {
	const t = useTranslations("adminPanel");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const q = useQuery(
		orpc.adminUser.location.queryOptions({ input: { userId } }),
	);
	const revoke = useMutation({
		mutationFn: (reason: string) =>
			client.adminUser.revokeLocation({ userId, reason }),
		onSuccess: (r) => {
			toast.success(t("locationRevoked", { count: r.sharesRevoked }));
			qc.invalidateQueries({
				queryKey: orpc.adminUser.location.queryKey({ input: { userId } }),
			});
		},
		onError: (e: Error) => toast.error(e.message),
	});
	const d = q.data;
	const active = !!d && (d.nearby !== null || d.shares.length > 0);
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-2">
				<CardTitle className="flex items-center gap-2">
					<MapPinIcon className="size-4" />
					{t("locationTitle")}
				</CardTitle>
				{canRevoke && active ? (
					<ReasonConfirm
						title={t("locationRevokeTitle")}
						body={t("locationRevokeBody")}
						confirmLabel={t("locationRevoke")}
						destructive
						onConfirm={(reason) => revoke.mutate(reason)}
						trigger={
							<Button variant="outline" size="sm" disabled={revoke.isPending}>
								<MapPinOffIcon className="size-4" />
								{t("locationRevoke")}
							</Button>
						}
					/>
				) : null}
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				<p className="text-xs text-muted-foreground">
					{t("locationPrivacyNote")}
				</p>
				{!d ? null : (
					<>
						<p>
							<span className="text-muted-foreground">
								{t("locationNearby")}:{" "}
							</span>
							{d.nearby
								? t("locationNearbyOn", {
										scope:
											d.nearby.eventTitle ?? t(`nearbyScope_${d.nearby.scope}`),
										precision: t(`nearbyPrecision_${d.nearby.precision}`),
									})
								: t("locationOff")}
						</p>
						<p>
							<span className="text-muted-foreground">
								{t("locationShares")}:{" "}
							</span>
							{d.shares.length === 0
								? t("locationOff")
								: t("locationSharesCount", { count: d.shares.length })}
						</p>
						{d.lastLocationAt ? (
							<p className="text-muted-foreground">
								{t("locationLastUpdate", {
									date: fmt.dateTime(d.lastLocationAt),
								})}
								{d.sharingPaused ? ` · ${t("locationPaused")}` : ""}
							</p>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	);
}
