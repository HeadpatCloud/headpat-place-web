import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	AtSign,
	Bell,
	Eye,
	KeyRound,
	Link2,
	Palette,
	ShieldCheck,
	TriangleAlert,
	UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountHero } from "@/components/account/AccountHero";
import { AccountNav, type NavItem } from "@/components/account/AccountNav";
import { AccountSection } from "@/components/account/AccountSection";
import { ApiKeysSection } from "@/components/account/ApiKeysSection";
import { AppearanceSettings } from "@/components/account/AppearanceSettings";
import { ConnectedAccounts } from "@/components/account/ConnectedAccounts";
import { DangerZone } from "@/components/account/DangerZone";
import { NotificationsSection } from "@/components/account/NotificationsSection";
import { PresenceSettings } from "@/components/account/PresenceSettings";
import { PrivacySection } from "@/components/account/PrivacySection";
import { ProfileCompleteness } from "@/components/account/ProfileCompleteness";
import { ProfileSection } from "@/components/account/ProfileSection";
import { Section } from "@/components/account/Section";
import { SecuritySection } from "@/components/account/SecuritySection";
import type { AccountProfile } from "@/components/account/types";
import { authClient, useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/account/")({
	component: AccountPage,
});

const SECTION_IDS = [
	"profile",
	"account",
	"security",
	"connections",
	"privacy",
	"notifications",
	"appearance",
	"apikeys",
	"danger",
] as const;

const SECTION_ICONS = {
	profile: UserRound,
	account: AtSign,
	security: ShieldCheck,
	connections: Link2,
	privacy: Eye,
	notifications: Bell,
	appearance: Palette,
	apikeys: KeyRound,
	danger: TriangleAlert,
} as const;

function AccountPage() {
	const t = useTranslations("accountPages");
	const c = useTranslations("common");
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const queryClient = useQueryClient();
	const [active, setActive] = useState("profile");

	const SECTIONS: NavItem[] = SECTION_IDS.map((id) => ({
		id,
		label: t(`nav_${id}`),
		icon: SECTION_ICONS[id],
	}));

	useEffect(() => {
		if (!isPending && !session?.user) navigate({ to: "/login" as never });
	}, [session, isPending, navigate]);

	const profileQuery = useQuery({
		...orpc.profile.me.queryOptions({ input: undefined }),
		enabled: !!session?.user,
	});

	const updateProfile = useMutation({
		mutationFn: async (input: Parameters<typeof client.profile.update>[0]) =>
			client.profile.update(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.profile.me.queryKey() });
			toast.success(t("saved"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const profile = profileQuery.data as AccountProfile | undefined;

	useEffect(() => {
		if (!profile) return;
		const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
			(el): el is HTMLElement => el !== null,
		);
		if (!els.length) return;
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible[0]) setActive(visible[0].target.id);
			},
			{ rootMargin: "-15% 0px -75% 0px", threshold: 0 },
		);
		for (const el of els) observer.observe(el);
		return () => observer.disconnect();
	}, [profile]);

	function goTo(id: string) {
		setActive(id);
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	async function deleteAccount(args: { password: string; totpCode?: string }) {
		try {
			await client.account.delete(args);
		} catch (e) {
			toast.error((e as Error).message ?? t("deleteAccountFailed"));
			throw e;
		}
		toast.success(t("accountDeleted"));
		await authClient.signOut().catch(() => {});
		navigate({ to: "/" });
	}

	if (isPending || (session?.user && profileQuery.isPending)) {
		return <p className="p-4 text-muted-foreground">{c("loading")}</p>;
	}
	if (!session?.user || !profile) return null;

	return (
		<div className="space-y-6">
			<AccountHero
				profile={profile}
				onChangeMedia={(field, fileId) =>
					updateProfile.mutateAsync({ [field]: fileId })
				}
			/>

			<AccountNav
				variant="bar"
				items={SECTIONS}
				activeId={active}
				onSelect={goTo}
				className="sticky top-2 z-20 lg:hidden"
			/>

			<div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
				<aside className="hidden lg:block">
					<div className="sticky top-6">
						<AccountNav
							variant="rail"
							items={SECTIONS}
							activeId={active}
							onSelect={goTo}
						/>
					</div>
				</aside>

				<div className="min-w-0 space-y-12">
					<Section
						id="profile"
						title={t("nav_profile")}
						description={t("profileDescription")}
					>
						<div className="space-y-8">
							<ProfileCompleteness profile={profile} />
							<ProfileSection
								profile={profile}
								saving={updateProfile.isPending}
								onSave={(values) =>
									updateProfile.mutateAsync({
										...values,
										birthday: values.birthday ?? null,
									})
								}
							/>
							<div className="border-t border-border pt-6">
								<h3 className="mb-3 text-sm font-semibold">
									{t("presenceHeading")}
								</h3>
								<PresenceSettings />
							</div>
						</div>
					</Section>

					<Section
						id="account"
						title={t("nav_account")}
						description={t("accountDescription")}
					>
						<AccountSection
							profile={profile}
							email={session.user.email}
							emailVerified={!!session.user.emailVerified}
							onSaveUrl={(url) =>
								updateProfile.mutateAsync({ profileUrl: url })
							}
							onChangeTimezone={(tz) => updateProfile.mutate({ timezone: tz })}
						/>
					</Section>

					<Section
						id="security"
						title={t("nav_security")}
						description={t("securityDescription")}
					>
						<SecuritySection />
					</Section>

					<Section
						id="connections"
						title={t("nav_connections")}
						description={t("connectionsDescription")}
					>
						<ConnectedAccounts />
					</Section>

					<Section
						id="privacy"
						title={t("nav_privacy")}
						description={t("privacyDescription")}
					>
						<PrivacySection
							profile={profile}
							onChange={(field, value) =>
								updateProfile.mutate({ [field]: value })
							}
						/>
					</Section>

					<Section
						id="notifications"
						title={t("nav_notifications")}
						description={t("notificationsDescription")}
					>
						<NotificationsSection
							profile={profile}
							onUpdate={(patch) => updateProfile.mutate(patch)}
						/>
					</Section>

					<Section
						id="appearance"
						title={t("nav_appearance")}
						description={t("appearanceDescription")}
					>
						<AppearanceSettings />
					</Section>

					<Section
						id="apikeys"
						title={t("nav_apikeys")}
						description={t("apiKeysDescription")}
					>
						<ApiKeysSection />
					</Section>

					<Section id="danger" title={t("nav_danger")}>
						<DangerZone
							twoFactorEnabled={!!session.user.twoFactorEnabled}
							onDelete={deleteAccount}
						/>
					</Section>
				</div>
			</div>
		</div>
	);
}
