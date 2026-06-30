import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ExternalLinkIcon,
	HistoryIcon,
	KeyIcon,
	MonitorIcon,
	ShieldCheckIcon,
	XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserAuditLog } from "@/components/admin/UserAuditLog";
import { StorageImage } from "@/components/StorageImage";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/users/$userId")({
	component: UserDetail,
});

function deviceLabel(ua: string | null | undefined, fallback: string): string {
	if (!ua) return fallback;
	const browser = /Edg/.test(ua)
		? "Edge"
		: /OPR|Opera/.test(ua)
			? "Opera"
			: /Chrome/.test(ua)
				? "Chrome"
				: /Firefox/.test(ua)
					? "Firefox"
					: /Safari/.test(ua)
						? "Safari"
						: "Browser";
	const os = /Windows/.test(ua)
		? "Windows"
		: /Macintosh|Mac OS/.test(ua)
			? "macOS"
			: /Android/.test(ua)
				? "Android"
				: /iPhone|iPad|iOS/.test(ua)
					? "iOS"
					: /Linux/.test(ua)
						? "Linux"
						: null;
	return os ? `${browser} · ${os}` : browser;
}

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-start justify-between gap-3 py-1.5 text-sm">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className="min-w-0 truncate text-right font-medium">
				{children}
			</span>
		</div>
	);
}

function UserDetail() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const { userId } = Route.useParams();
	const qc = useQueryClient();
	const fmt = useDateFormat();
	const [reason, setReason] = useState("");
	const [roleToAdd, setRoleToAdd] = useState("");

	const userQ = useQuery(
		orpc.adminUser.get.queryOptions({ input: { userId } }),
	);
	const rolesQ = useQuery(orpc.adminRole.list.queryOptions({ input: {} }));
	const sessionsQ = useQuery(
		orpc.adminUser.sessions.queryOptions({ input: { userId } }),
	);
	const accountsQ = useQuery(
		orpc.adminUser.connectedAccounts.queryOptions({ input: { userId } }),
	);
	const keysQ = useQuery(
		orpc.adminUser.apiKeys.queryOptions({ input: { userId } }),
	);

	function invalidateUser() {
		qc.invalidateQueries({
			queryKey: orpc.adminUser.get.queryKey({ input: { userId } }),
		});
	}
	function invalidateSessions() {
		qc.invalidateQueries({
			queryKey: orpc.adminUser.sessions.queryKey({ input: { userId } }),
		});
		invalidateUser();
	}

	const setBanned = useMutation({
		mutationFn: (vars: { banned: boolean; reason?: string }) =>
			client.adminUser.setBanned({ userId, ...vars }),
		onSuccess: () => {
			setReason("");
			invalidateUser();
			invalidateSessions();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const assign = useMutation({
		mutationFn: (roleId: string) => client.adminRole.assign({ userId, roleId }),
		onSuccess: () => {
			setRoleToAdd("");
			invalidateUser();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const unassign = useMutation({
		mutationFn: (roleId: string) =>
			client.adminRole.unassign({ userId, roleId }),
		onSuccess: () => invalidateUser(),
		onError: (e: Error) => toast.error(e.message),
	});

	const revokeSession = useMutation({
		mutationFn: (sessionId: string) =>
			client.adminUser.revokeSession({ userId, sessionId }),
		onSuccess: () => {
			toast.success(t("sessionRevoked"));
			invalidateSessions();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const revokeAll = useMutation({
		mutationFn: () => client.adminUser.revokeAllSessions({ userId }),
		onSuccess: (r) => {
			toast.success(t("allSessionsRevoked", { count: r.revoked }));
			invalidateSessions();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const disable2fa = useMutation({
		mutationFn: () => client.adminUser.disable2fa({ userId }),
		onSuccess: () => {
			toast.success(t("disable2faDone"));
			invalidateUser();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const verifyEmail = useMutation({
		mutationFn: () => client.adminUser.verifyEmail({ userId }),
		onSuccess: () => {
			toast.success(t("emailVerifiedDone"));
			invalidateUser();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (userQ.isError)
		return <p className="text-muted-foreground">{t("noAccess")}</p>;
	if (userQ.isPending)
		return <p className="text-muted-foreground">{c("loading")}</p>;
	if (!userQ.data) return <p>{t("userNotFound")}</p>;

	const u = userQ.data;
	const assignedIds = new Set(u.roles.map((r) => r.id));
	const available = (rolesQ.data ?? []).filter((r) => !assignedIds.has(r.id));
	const socials = [
		u.discordName && { label: "Discord", value: u.discordName },
		u.telegramName && { label: "Telegram", value: u.telegramName },
		u.furaffinityName && { label: "FurAffinity", value: u.furaffinityName },
		u.xName && { label: "X", value: u.xName },
		u.twitchName && { label: "Twitch", value: u.twitchName },
		u.blueskyName && { label: "Bluesky", value: u.blueskyName },
	].filter(Boolean) as { label: string; value: string }[];

	return (
		<div className="space-y-4">
			<Card>
				<CardContent className="flex flex-row items-center gap-4 p-4">
					<StorageImage
						kind="avatar"
						fileId={u.avatarFileId}
						variant="sm"
						className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover bg-muted"
						fallback={
							<div className="h-16 w-16 shrink-0 rounded-lg border border-border bg-muted" />
						}
					/>
					<div className="min-w-0 flex-1 space-y-0.5">
						<div className="flex flex-wrap items-center gap-2">
							<p className="truncate font-semibold">
								{u.displayName || u.name || u.profileUrl}
							</p>
							{u.banned ? (
								<Badge variant="destructive">{t("bannedBadge")}</Badge>
							) : null}
							{u.role === "admin" ? <Badge>admin</Badge> : null}
							{u.twoFactorEnabled ? (
								<Badge variant="secondary" className="gap-1">
									<ShieldCheckIcon className="size-3" />
									2FA
								</Badge>
							) : null}
						</div>
						<p className="truncate text-xs text-muted-foreground">
							@{u.profileUrl}
						</p>
						<p className="truncate text-xs text-muted-foreground">{u.email}</p>
						<p className="text-xs text-muted-foreground">
							{t("joined", { date: fmt.date(u.createdAt) })}
						</p>
					</div>
					<div className="flex shrink-0 flex-col gap-2">
						{u.profileUrl ? (
							<Button asChild variant="outline" size="sm">
								<Link to={`/user/${u.profileUrl}` as never}>
									{t("viewProfile")}
									<ExternalLinkIcon className="size-4" />
								</Link>
							</Button>
						) : null}
						<UserAuditLog
							userId={userId}
							trigger={
								<Button type="button" variant="outline" size="sm">
									<HistoryIcon className="size-4" />
									{t("auditLog")}
								</Button>
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("accountInfo")}</CardTitle>
				</CardHeader>
				<CardContent className="divide-y divide-border">
					<Row label={t("email")}>
						<span className="inline-flex items-center gap-1.5">
							{u.email}
							<Badge variant={u.emailVerified ? "secondary" : "destructive"}>
								{u.emailVerified ? t("emailVerified") : t("emailUnverified")}
							</Badge>
						</span>
					</Row>
					<Row label={t("role")}>{u.role}</Row>
					<Row label={t("twoFactor")}>
						{u.twoFactorEnabled ? t("twoFactorOn") : t("twoFactorOff")}
					</Row>
					<Row label={t("userId")}>
						<code className="text-xs">{u.userId}</code>
					</Row>
					<Row label={t("created")}>{fmt.date(u.createdAt)}</Row>
					<Row label={t("updated")}>{fmt.date(u.updatedAt)}</Row>
					{u.appwriteId ? (
						<Row label="Appwrite ID">
							<code className="text-xs">{u.appwriteId}</code>
						</Row>
					) : null}
					<Row label={t("activity")}>
						{t("sessionsCount", { count: u.sessionCount })} ·{" "}
						{t("keysCount", { count: u.apiKeyCount })} ·{" "}
						{t("devicesCount", { count: u.deviceCount })}
					</Row>
				</CardContent>
			</Card>

			{u.bio ||
			u.pronouns ||
			u.location ||
			socials.length ||
			u.badges?.length ? (
				<Card>
					<CardHeader>
						<CardTitle>{t("profileInfo")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{u.status ? (
							<p className="text-sm text-muted-foreground italic">{u.status}</p>
						) : null}
						{u.bio ? (
							<p className="text-sm whitespace-pre-wrap">{u.bio}</p>
						) : null}
						<div className="divide-y divide-border">
							{u.pronouns ? (
								<Row label={t("pronouns")}>{u.pronouns}</Row>
							) : null}
							{u.location ? (
								<Row label={t("location")}>{u.location}</Row>
							) : null}
							{u.timezone ? (
								<Row label={t("timezone")}>{u.timezone}</Row>
							) : null}
							{u.birthday ? (
								<Row label={t("birthday")}>{fmt.date(u.birthday)}</Row>
							) : null}
							<Row label={t("followers")}>
								{u.followersCount} · {u.followingCount} {t("followingWord")}
							</Row>
						</div>
						{socials.length ? (
							<div className="flex flex-wrap gap-1.5">
								{socials.map((s) => (
									<Badge key={s.label} variant="secondary">
										{s.label}: {s.value}
									</Badge>
								))}
							</div>
						) : null}
						{u.badges?.length ? (
							<div className="flex flex-wrap gap-1.5">
								{u.badges.map((b) => (
									<Badge key={b}>{b}</Badge>
								))}
							</div>
						) : null}
						<div className="flex flex-wrap gap-1.5">
							{u.nsfwEnabled ? (
								<Badge variant="secondary">{t("nsfwEnabled")}</Badge>
							) : null}
							{u.indexingEnabled ? (
								<Badge variant="secondary">{t("indexingEnabled")}</Badge>
							) : null}
						</div>
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader className="flex flex-row items-center justify-between gap-2">
					<CardTitle className="flex items-center gap-2">
						<MonitorIcon className="size-4" />
						{t("sessions")}
					</CardTitle>
					{(sessionsQ.data ?? []).length > 0 ? (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									disabled={revokeAll.isPending}
								>
									{t("revokeAllSessions")}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										{t("revokeAllConfirmTitle")}
									</AlertDialogTitle>
									<AlertDialogDescription>
										{t("revokeAllConfirmBody")}
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
									<AlertDialogAction onClick={() => revokeAll.mutate()}>
										{t("revokeAllSessions")}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					) : null}
				</CardHeader>
				<CardContent className="space-y-2">
					{sessionsQ.isPending ? (
						<p className="text-sm text-muted-foreground">{c("loading")}</p>
					) : (sessionsQ.data ?? []).length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("noSessions")}</p>
					) : (
						(sessionsQ.data ?? []).map((s) => (
							<div
								key={s.id}
								className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5"
							>
								<div className="min-w-0 space-y-0.5">
									<p className="truncate text-sm font-medium">
										{deviceLabel(s.userAgent, t("sessionUnknownDevice"))}
										{s.impersonatedBy ? (
											<Badge variant="destructive" className="ml-2">
												{t("impersonated")}
											</Badge>
										) : null}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{s.ipAddress || "—"} ·{" "}
										{t("sessionExpires", { date: fmt.date(s.expiresAt) })}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									disabled={revokeSession.isPending}
									onClick={() => revokeSession.mutate(s.id)}
								>
									{t("revokeSession")}
								</Button>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShieldCheckIcon className="size-4" />
						{t("security")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="text-sm font-medium">{t("email")}</p>
							<p className="truncate text-xs text-muted-foreground">
								{u.email} ·{" "}
								{u.emailVerified ? t("emailVerified") : t("emailUnverified")}
							</p>
						</div>
						{u.emailVerified ? (
							<Badge variant="secondary">{t("emailVerified")}</Badge>
						) : (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										disabled={verifyEmail.isPending}
									>
										{t("verifyEmail")}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t("verifyEmailConfirmTitle")}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t("verifyEmailConfirmBody")}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
										<AlertDialogAction onClick={() => verifyEmail.mutate()}>
											{t("verifyEmail")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
					<Separator />
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm font-medium">{t("twoFactor")}</p>
							<p className="text-xs text-muted-foreground">
								{u.twoFactorEnabled ? t("twoFactorOn") : t("twoFactorOff")}
							</p>
						</div>
						{u.twoFactorEnabled ? (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										disabled={disable2fa.isPending}
									>
										{t("disable2fa")}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t("disable2faConfirmTitle")}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t("disable2faConfirmBody")}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => disable2fa.mutate()}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											{t("disable2fa")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						) : null}
					</div>
					<Separator />
					<div className="space-y-2">
						<p className="text-sm font-medium">{t("loginMethods")}</p>
						{accountsQ.isPending ? (
							<p className="text-sm text-muted-foreground">{c("loading")}</p>
						) : (accountsQ.data ?? []).length === 0 ? (
							<p className="text-sm text-muted-foreground">
								{t("noLoginMethods")}
							</p>
						) : (
							<div className="flex flex-wrap gap-1.5">
								{(accountsQ.data ?? []).map((a) => (
									<Badge key={a.id} variant="secondary">
										{a.providerId === "credential"
											? t("providerCredential")
											: a.providerId}
									</Badge>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<KeyIcon className="size-4" />
						{t("apiKeysUser")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{keysQ.isPending ? (
						<p className="text-sm text-muted-foreground">{c("loading")}</p>
					) : (keysQ.data ?? []).length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("apiKeysNone")}</p>
					) : (
						(keysQ.data ?? []).map((k) => (
							<div
								key={k.id}
								className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5"
							>
								<div className="min-w-0">
									<p className="truncate text-sm font-medium">
										{k.name || k.prefix || k.id}
										<Badge variant="secondary" className="ml-2">
											{k.kind}
										</Badge>
										{!k.enabled ? (
											<Badge variant="destructive" className="ml-1">
												{t("apiKeyDisabled")}
											</Badge>
										) : null}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{k.lastRequest
											? t("apiKeysLastUsed", { date: fmt.date(k.lastRequest) })
											: t("apiKeysNeverUsed")}
										{" · "}
										{k.expiresAt
											? t("apiKeysExpiresAt", { date: fmt.date(k.expiresAt) })
											: t("apiKeysNeverExpires")}
									</p>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("roles")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex flex-wrap gap-1.5">
						{u.roles.length === 0 ? (
							<span className="text-sm text-muted-foreground">
								{t("noRoles")}
							</span>
						) : (
							u.roles.map((r) => (
								<span
									key={r.id}
									className="inline-flex items-center gap-1 rounded-md border border-primary px-2 py-1 text-xs text-primary"
								>
									{r.name}
									<button
										type="button"
										disabled={unassign.isPending}
										onClick={() => unassign.mutate(r.id)}
										className="hover:opacity-70"
									>
										<XIcon className="size-3" />
									</button>
								</span>
							))
						)}
					</div>
					<div className="flex gap-2">
						<Select value={roleToAdd} onValueChange={setRoleToAdd}>
							<SelectTrigger className="flex-1">
								<SelectValue placeholder={t("addRole")} />
							</SelectTrigger>
							<SelectContent>
								{available.map((r) => (
									<SelectItem key={r.id} value={r.id}>
										{r.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							disabled={!roleToAdd || assign.isPending}
							onClick={() => assign.mutate(roleToAdd)}
							className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
						>
							{t("add")}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("moderation")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{u.banned ? (
						<>
							{u.banReason ? (
								<p className="text-sm text-muted-foreground">
									{t("banReasonLabel", { reason: u.banReason })}
								</p>
							) : null}
							<Button
								variant="outline"
								disabled={setBanned.isPending}
								onClick={() => setBanned.mutate({ banned: false })}
							>
								{t("unban")}
							</Button>
						</>
					) : (
						<div className="flex gap-2">
							<Input
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder={t("banReasonPlaceholder")}
							/>
							<Button
								disabled={setBanned.isPending}
								onClick={() =>
									setBanned.mutate({
										banned: true,
										reason: reason.trim() || undefined,
									})
								}
								className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
							>
								{t("ban")}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
