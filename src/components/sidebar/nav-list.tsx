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
		exact?: boolean;
	}[];
	label?: string;
}) {
	const { toggleSidebar, isMobile } = useSidebar();
	return (
		<SidebarGroup className="px-0 py-0">
			{label ? (
				<SidebarGroupLabel className="h-auto px-3.5 pb-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
					{label}
				</SidebarGroupLabel>
			) : null}
			<SidebarMenu className="gap-0.5">
				{projects.map((item) => (
					<SidebarMenuItem key={item.name}>
						{item.disabled ? (
							<SidebarMenuButton
								disabled
								className="h-10 rounded-2xl px-3.5 text-base font-bold opacity-40 [&>svg]:size-5"
							>
								<item.icon />
								<span>{item.name}</span>
							</SidebarMenuButton>
						) : (
							<SidebarMenuButton
								asChild
								className="h-10 rounded-2xl px-3.5 text-base font-bold text-sidebar-foreground [&>svg]:size-5"
							>
								<Link
									to={item.url}
									onClick={isMobile ? toggleSidebar : undefined}
									activeOptions={{ exact: item.exact ?? item.url === "/" }}
									activeProps={{
										className: "bg-primary/15 font-extrabold text-link",
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
