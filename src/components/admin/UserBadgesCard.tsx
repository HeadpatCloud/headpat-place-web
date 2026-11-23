import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeList, useBadgeText } from "@/components/profile/ProfileBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BADGE_STYLE, MANUAL_BADGES, type ManualBadgeId } from "@/lib/badges";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

const MANUAL_SET = new Set<string>(MANUAL_BADGES);

export function UserBadgesCard({
	userId,
	stored,
	canEdit,
}: {
	userId: string;
	// Raw user_profile.badges, which may still hold old Appwrite strings.
	stored: string[];
	canEdit: boolean;
}) {
	const t = useTranslations("badges");
	const text = useBadgeText();
	const qc = useQueryClient();
	const earnedQ = useQuery(
		orpc.profile.badges.queryOptions({ input: { userId } }),
	);
	const earned = (earnedQ.data ?? []).filter((b) => !MANUAL_SET.has(b.id));
	const granted = stored.filter((b): b is ManualBadgeId => MANUAL_SET.has(b));
	const legacy = stored.filter((b) => !MANUAL_SET.has(b));

	const save = useMutation({
		mutationFn: (badges: ManualBadgeId[]) =>
			client.adminUser.setBadges({ userId, badges }),
		onSuccess: () => {
			toast.success(t("admin.saved"));
			qc.invalidateQueries({ queryKey: orpc.adminUser.get.key() });
			qc.invalidateQueries({ queryKey: orpc.profile.badges.key() });
		},
		onError: () => toast.error(t("admin.failed")),
	});

	function toggle(id: ManualBadgeId, on: boolean) {
		const next = on ? [...granted, id] : granted.filter((b) => b !== id);
		save.mutate(MANUAL_BADGES.filter((b) => next.includes(b)));
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("admin.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">{t("admin.earned")}</p>
					{earned.length ? (
						<BadgeList badges={earned} />
					) : (
						<p className="text-sm">{t("admin.none")}</p>
					)}
				</div>
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">{t("admin.granted")}</p>
					{MANUAL_BADGES.map((id) => {
						const { icon: Icon } = BADGE_STYLE[id];
						const inputId = `badge-${id}`;
						return (
							<div key={id} className="flex items-start gap-3">
								<Checkbox
									id={inputId}
									checked={granted.includes(id)}
									disabled={!canEdit || save.isPending}
									onCheckedChange={(v) => toggle(id, v === true)}
								/>
								<Label htmlFor={inputId} className="grid gap-0.5 font-normal">
									<span className="flex items-center gap-1.5 font-medium">
										<Icon className="size-3.5" aria-hidden />
										{text.name({ id })}
									</span>
									<span className="text-xs text-muted-foreground">
										{text.description({ id })}
									</span>
								</Label>
							</div>
						);
					})}
				</div>
				{legacy.length ? (
					<p className="text-xs text-muted-foreground">
						{t("admin.legacy", { values: legacy.join(", ") })}
					</p>
				) : null}
			</CardContent>
		</Card>
	);
}
