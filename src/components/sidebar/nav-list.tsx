import type { LucideIcon } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { LocalizedLink as Link } from "@/lib/localized-nav";

export function NavList({
	projects,
	label,
}: {
	projects: {
		name: string;
		url: string;
		icon: LucideIcon;
		disabled?: boolean;
	}[];
	label?: string;
}) {
	const { toggleSidebar, isMobile } = useSidebar();
	return (
		<SidebarGroup>
			{label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
			<SidebarMenu>
				{projects.map((item) => (
					<SidebarMenuItem key={item.name}>
						{item.disabled ? (
							<SidebarMenuButton disabled className="opacity-40">
								<item.icon />
								<span>{item.name}</span>
							</SidebarMenuButton>
						) : (
							<SidebarMenuButton asChild>
								<Link
									to={item.url}
									onClick={isMobile ? toggleSidebar : undefined}
									activeProps={{
										className:
											"bg-primary/15 text-primary dark:text-emerald-400 font-semibold rounded-md",
									}}
								>
									<item.icon />
									<span>{item.name}</span>
								</Link>
							</SidebarMenuButton>
						)}
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
