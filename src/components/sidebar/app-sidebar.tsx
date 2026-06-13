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
	LayoutPanelLeftIcon,
	MapIcon,
	MegaphoneIcon,
	MessagesSquareIcon,
	PencilIcon,
	RocketIcon,
	ShieldIcon,
	UserSearchIcon,
} from "lucide-react";
import type * as React from "react";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";
import { Separator } from "../ui/separator";
import { NavList } from "./nav-list";
import { TeamSwitcher } from "./team-switcher";

export function AppSidebar({
	mode = "app",
	...props
}: React.ComponentProps<typeof Sidebar> & { mode?: "app" | "admin" }) {
	const nav = useTranslations("nav");

	const adminPerms = useQuery({
		...orpc.adminRole.myPermissions.queryOptions({ input: undefined }),
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
				name: nav("chat"),
				url: "/chat",
				icon: MessagesSquareIcon,
			},
			{
				name: nav("announcements"),
				url: "/announcements",
				icon: MegaphoneIcon,
			},
			{
				name: nav("notifications"),
				url: "/notifications",
				icon: BellIcon,
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
				name: nav("communities"),
				url: "/community",
				icon: HeartHandshakeIcon,
			},
		],
		adminAccess: [
			{ name: nav("roles"), url: "/admin/roles", icon: ShieldIcon },
			{
				name: nav("adminUsers"),
				url: "/admin/users",
				icon: UserSearchIcon,
			},
		],
		adminOps: [
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
		teams: [
			{
				name: "Place",
				activeName: "Headpat Place",
				logoLight: "/logos/place_light_x250.webp",
				logoDark: "/logos/place_dark_x250.webp",
				href: "https://headpat.place",
			},
			{
				name: "Space",
				logoLight: "/logos/space_light_x250.webp",
				logoDark: "/logos/space_dark_x250.webp",
				href: "https://headpat.space",
			},
			{
				name: "Developer",
				logoLight: "/logos/developer_light_x250.webp",
				logoDark: "/logos/developer_dark_x250.webp",
				href: "https://headpat.dev",
			},
		],
	};

	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				{mode === "admin" ? (
					<>
						<NavList label="Access" projects={data.adminAccess} />
						<Separator />
						<NavList label="Operations" projects={data.adminOps} />
						<Separator />
						<NavList projects={data.adminBack} />
						<NavSecondary items={data.navSecondary} className="mt-auto" />
					</>
				) : (
					<>
						<NavList projects={data.navMain} />
						<Separator />
						<NavList projects={data.secondMain} />
						{isStaff ? (
							<>
								<Separator />
								<NavList
									projects={[
										{ name: "Admin", url: "/admin", icon: ShieldIcon },
									]}
								/>
							</>
						) : null}
						<Separator />
						<NavList projects={data.thirdMain} />
						<NavSecondary items={data.navSecondary} className="mt-auto" />
					</>
				)}
			</SidebarContent>
			<SidebarFooter>
				<Separator />
				<span className="text-muted-foreground text-center text-sm">
					BETA 0.8.14 <RocketIcon className="inline-block size-4" />
				</span>
				<Separator />
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
