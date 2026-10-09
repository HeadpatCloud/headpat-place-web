import { SiDiscord, SiGithub } from "@icons-pack/react-simple-icons";
import { useQuery } from "@tanstack/react-query";
import {
	BadgeHelpIcon,
	BellIcon,
	CalendarIcon,
	FileCheckIcon,
	FileIcon,
	HeartHandshakeIcon,
	HomeIcon,
	KeyRoundIcon,
	LayoutDashboardIcon,
	LayoutPanelLeftIcon,
	MapIcon,
	MegaphoneIcon,
	MessagesSquareIcon,
	PencilIcon,
	RocketIcon,
	ScrollTextIcon,
	ShieldIcon,
	UserSearchIcon,
} from "lucide-react";
import type * as React from "react";
import { useAuthState } from "@/components/contexts/SessionHint";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { NavList } from "./nav-list";
import { SiteSwitcher } from "./site-switcher";

export function AppSidebar({
	mode = "app",
	...props
}: React.ComponentProps<typeof Sidebar> & { mode?: "app" | "admin" }) {
	const nav = useTranslations("nav");

	const { data: session } = useSession();
	const { signedIn, pending } = useAuthState();
	const signedOut = !pending && !signedIn;
	const adminPerms = useQuery({
		...orpc.adminRole.myPermissions.queryOptions({ input: undefined }),
		enabled: !!session?.user,
		staleTime: 5 * 60_000,
	});
	const isStaff = (adminPerms.data?.length ?? 0) > 0;

	const data = {
		navMain: [
			{
				name: nav("home"),
				url: "/",
				icon: HomeIcon,
			},
			{
				name: nav("gallery"),
				url: "/gallery",
				icon: LayoutPanelLeftIcon,
			},
			{
				name: nav("communities"),
				url: "/community",
				icon: HeartHandshakeIcon,
			},
			{
				name: nav("announcements"),
				url: "/announcements",
				icon: MegaphoneIcon,
			},
			{
				name: nav("events"),
				url: "/events",
				icon: CalendarIcon,
			},
			{
				name: nav("map"),
				url: "/map",
				icon: MapIcon,
			},
			{
				name: nav("users"),
				url: "/users",
				icon: UserSearchIcon,
			},
		],
		secondMain: [
			{
				name: nav("myprofile"),
				url: "/profile",
				icon: FileIcon,
			},
			{
				name: nav("chat"),
				url: "/chat",
				icon: MessagesSquareIcon,
				disabled: signedOut,
			},
			{
				name: nav("notifications"),
				url: "/notifications",
				icon: BellIcon,
				disabled: signedOut,
			},
		],
		adminOverview: [
			{
				name: nav("adminDashboard"),
				url: "/admin",
				icon: LayoutDashboardIcon,
				exact: true,
			},
		],
		adminPeople: [
			{
				name: nav("adminUsers"),
				url: "/admin/users",
				icon: UserSearchIcon,
			},
			{ name: nav("roles"), url: "/admin/roles", icon: ShieldIcon },
			{
				name: nav("adminApiKeys"),
				url: "/admin/api-keys",
				icon: KeyRoundIcon,
			},
		],
		adminModeration: [
			{
				name: nav("reports"),
				url: "/admin/reports",
				icon: FileCheckIcon,
			},
			{
				name: nav("tickets"),
				url: "/admin/tickets",
				icon: BadgeHelpIcon,
			},
			{
				name: nav("adminGallery"),
				url: "/admin/gallery",
				icon: LayoutPanelLeftIcon,
			},
			{
				name: nav("adminCommunities"),
				url: "/admin/communities",
				icon: HeartHandshakeIcon,
			},
			{
				name: nav("adminEvents"),
				url: "/admin/events",
				icon: CalendarIcon,
			},
		],
		adminContent: [
			{
				name: nav("adminChangelog"),
				url: "/admin/changelog",
				icon: PencilIcon,
			},
			{
				name: nav("adminAnnouncements"),
				url: "/admin/announcements",
				icon: MegaphoneIcon,
			},
		],
		adminSystem: [
			{
				name: nav("adminAudit"),
				url: "/admin/audit",
				icon: ScrollTextIcon,
			},
		],
		adminBack: [{ name: nav("backToHeadpat"), url: "/", icon: HomeIcon }],
		navSecondary: [
			{
				title: "Discord",
				url: "https://discord.gg/EaQTEKRg2A",
				icon: SiDiscord,
			},
			{
				title: "GitHub",
				url: "https://github.com/headpatcloud/",
				icon: SiGithub,
			},
		],
		thirdMain: [
			{
				name: nav("legal"),
				url: "/legal",
				icon: FileCheckIcon,
			},
			{
				name: nav("support"),
				url: "/support",
				icon: BadgeHelpIcon,
			},
			{
				name: nav("changelog"),
				url: "/changelog",
				icon: PencilIcon,
			},
		],
		footerLinks: [
			{ name: nav("support"), url: "/support", external: false },
			{ name: nav("changelog"), url: "/changelog", external: false },
			{ name: nav("legal"), url: "/legal", external: false },
			{ name: "Discord", url: "https://discord.gg/EaQTEKRg2A", external: true },
		],
		sites: [
			{ name: "Place", href: "https://headpat.place", active: true },
			{ name: "Space", href: "https://headpat.space" },
			{ name: "Dev", href: "https://headpat.dev" },
		],
	};

	return (
		<Sidebar variant="floating" {...props}>
			<SidebarHeader className="px-3 pt-4">
				<SiteSwitcher sites={data.sites} />
			</SidebarHeader>
			<SidebarContent className="gap-5 px-3 py-3">
				{mode === "admin" ? (
					<>
						<NavList projects={data.adminOverview} />
						<NavList
							label={nav("adminGroupPeople")}
							projects={data.adminPeople}
						/>
						<NavList
							label={nav("adminGroupModeration")}
							projects={data.adminModeration}
						/>
						<NavList
							label={nav("adminGroupContent")}
							projects={data.adminContent}
						/>
						<NavList
							label={nav("adminGroupSystem")}
							projects={data.adminSystem}
						/>
						<NavList projects={data.adminBack} />
						<NavSecondary items={data.navSecondary} className="mt-auto" />
					</>
				) : (
					<>
						<NavList label={nav("explore")} projects={data.navMain} />
						<NavList
							label={nav("you")}
							projects={[
								...data.secondMain,
								...(isStaff
									? [{ name: "Admin", url: "/admin", icon: ShieldIcon }]
									: []),
							]}
						/>
					</>
				)}
			</SidebarContent>
			<SidebarFooter className="gap-3 px-3 pb-3">
				{mode === "admin" ? null : (
					<div className="flex flex-wrap gap-x-1 px-1">
						{data.footerLinks.map((l) =>
							l.external ? (
								<a
									key={l.name}
									href={l.url}
									target="_blank"
									rel="noreferrer"
									className="rounded-lg px-2 py-1 text-sm font-bold text-muted-foreground hover:text-foreground"
								>
									{l.name}
								</a>
							) : (
								<Link
									key={l.name}
									to={l.url}
									className="rounded-lg px-2 py-1 text-sm font-bold text-muted-foreground hover:text-foreground"
								>
									{l.name}
								</Link>
							),
						)}
					</div>
				)}
				<span className="text-muted-foreground text-center text-xs">
					BETA {__APP_VERSION__}{" "}
					<RocketIcon className="inline-block size-3.5" />
				</span>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
