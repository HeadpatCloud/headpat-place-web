import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	AtSign,
	Bell,
	Eye,
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
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/_app/account/")({
	component: AccountPage,
});

const SECTIONS: NavItem[] = [
	{ id: "profile", label: "Profile", icon: UserRound },
	{ id: "account", label: "Account", icon: AtSign },
	{ id: "security", label: "Security", icon: ShieldCheck },
	{ id: "connections", label: "Connections", icon: Link2 },
	{ id: "privacy", label: "Privacy", icon: Eye },
	{ id: "notifications", label: "Notifications", icon: Bell },
	{ id: "appearance", label: "Appearance", icon: Palette },
	{ id: "danger", label: "Danger zone", icon: TriangleAlert },
];

function AccountPage() {
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const queryClient = useQueryClient();
	const [active, setActive] = useState("profile");

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
			toast.success("Saved.");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const profile = profileQuery.data as AccountProfile | undefined;

	useEffect(() => {
		if (!profile) return;
		const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
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
			toast.error((e as Error).message ?? "Failed to delete account");
			throw e;
		}
		toast.success("Account deleted.");
		await authClient.signOut().catch(() => {});
		navigate({ to: "/" });
	}

	if (isPending || (session?.user && profileQuery.isPending)) {
		return <p className="p-4 text-muted-foreground">Loading…</p>;
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
						title="Profile"
						description="How you appear to everyone else."
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
								<h3 className="mb-3 text-sm font-semibold">Presence</h3>
								<PresenceSettings />
							</div>
						</div>
					</Section>

					<Section
						id="account"
						title="Account"
						description="Sign-in details and how people reach your profile."
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
						title="Security"
						description="Protect your account and manage where you're signed in."
					>
						<SecuritySection />
					</Section>

					<Section
						id="connections"
						title="Connections"
						description="Link other accounts to sign in with them."
					>
						<ConnectedAccounts />
					</Section>

					<Section
						id="privacy"
						title="Privacy"
						description="Control your visibility and what you see."
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
						title="Notifications"
						description="Choose which emails we send you."
					>
						<NotificationsSection
							profile={profile}
							onUpdate={(patch) => updateProfile.mutate(patch)}
						/>
					</Section>

					<Section
						id="appearance"
						title="Appearance"
						description="Theme and color across the whole app, including chat."
					>
						<AppearanceSettings />
					</Section>

					<Section id="danger" title="Danger zone">
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
