import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";

type Session = {
	id: string;
	token: string;
	userAgent?: string | null;
	ipAddress?: string | null;
	createdAt: string | Date;
	updatedAt: string | Date;
};

function describeDevice(ua?: string | null) {
	if (!ua) return { label: "Unknown device", mobile: false };
	const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
	let os = "Unknown OS";
	if (/Windows/i.test(ua)) os = "Windows";
	else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
	else if (/Android/i.test(ua)) os = "Android";
	else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
	else if (/Linux/i.test(ua)) os = "Linux";
	let browser = "Browser";
	if (/Edg\//i.test(ua)) browser = "Edge";
	else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
	else if (/Firefox\//i.test(ua)) browser = "Firefox";
	else if (/Chrome\//i.test(ua)) browser = "Chrome";
	else if (/Safari\//i.test(ua)) browser = "Safari";
	return { label: `${browser} on ${os}`, mobile };
}

export function ActiveSessions() {
	const t = useTranslations("accountPages");
	const qc = useQueryClient();
	const { data: current } = useSession();
	const currentToken = current?.session?.token;

	const sessions = useQuery({
		queryKey: ["account", "sessions"],
		queryFn: async () => {
			const r = await authClient.listSessions();
			if (r.error) throw new Error(r.error.message ?? t("loadSessionsFailed"));
			return (r.data ?? []) as Session[];
		},
	});

	const revoke = useMutation({
		mutationFn: async (token: string) => {
			const r = await authClient.revokeSession({ token });
			if (r.error) throw new Error(r.error.message ?? t("revokeFailed"));
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["account", "sessions"] });
			toast.success(t("sessionRevoked"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const revokeOthers = useMutation({
		mutationFn: async () => {
			const r = await authClient.revokeOtherSessions();
			if (r.error) throw new Error(r.error.message ?? t("revokeOthersFailed"));
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["account", "sessions"] });
			toast.success(t("signedOutOthers"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (sessions.isPending) {
		return (
			<div className="flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
				<Loader2 className="size-4 animate-spin" /> {t("loadingSessions")}
			</div>
		);
	}
	if (sessions.isError) {
		return (
			<div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
				{t("sessionsError")}
			</div>
		);
	}

	const list = sessions.data;
	const others = list.filter((s) => s.token !== currentToken).length;

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<ul className="divide-y divide-border">
				{list.map((s) => {
					const d = describeDevice(s.userAgent);
					const isCurrent = s.token === currentToken;
					const Icon = d.mobile ? Smartphone : Monitor;
					return (
						<li key={s.id} className="flex items-center gap-4 p-4">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
								<Icon className="size-5" />
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="truncate text-sm font-medium">
										{d.label}
									</span>
									{isCurrent ? (
										<Badge className="bg-primary/15 text-primary hover:bg-primary/15">
											{t("thisDevice")}
										</Badge>
									) : null}
								</div>
								<p className="truncate text-xs text-muted-foreground">
									{s.ipAddress ? `${s.ipAddress} · ` : ""}
									{t("activeAgo", {
										when: formatDistanceToNow(new Date(s.updatedAt), {
											addSuffix: true,
										}),
									})}
								</p>
							</div>
							{isCurrent ? null : (
								<Button
									variant="outline"
									size="sm"
									disabled={revoke.isPending}
									onClick={() => revoke.mutate(s.token)}
								>
									{t("revoke")}
								</Button>
							)}
						</li>
					);
				})}
			</ul>
			{others > 0 ? (
				<div className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 px-4 py-3">
					<span className="text-xs text-muted-foreground">
						{others === 1
							? t("otherSessionsOne")
							: t("otherSessionsMany", { count: others })}
					</span>
					<Button
						variant="destructive"
						size="sm"
						disabled={revokeOthers.isPending}
						onClick={() => revokeOthers.mutate()}
					>
						{t("signOutEverywhere")}
					</Button>
				</div>
			) : null}
		</div>
	);
}
