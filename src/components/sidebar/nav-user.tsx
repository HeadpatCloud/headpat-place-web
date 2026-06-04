import { Link } from "@tanstack/react-router";
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	LifeBuoy,
	LogOut,
} from "lucide-react";
import { useUser } from "@/components/contexts/UserContext";
import { useStorageUrl } from "@/components/StorageImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export function NavUser() {
	const { isMobile, toggleSidebar } = useSidebar();
	const { userData, current, logout } = useUser();
	const avatarUrl = useStorageUrl("avatar", userData?.avatarId, "md").data?.url;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={avatarUrl}
									alt={userData?.displayName || userData?.$id || ""}
								/>
								<AvatarFallback className="rounded-lg">
									{userData?.displayName?.charAt(0) || "HI"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{userData?.displayName || userData?.$id || "Login"}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										src={avatarUrl}
										alt={userData?.displayName || userData?.$id || ""}
									/>
									<AvatarFallback className="rounded-lg">
										{userData?.displayName?.charAt(0) || "HI"}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{userData?.displayName || userData?.$id || "Login"}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<Link
								to={"/account" as never}
								onClick={isMobile ? toggleSidebar : undefined}
							>
								<DropdownMenuItem>
									<BadgeCheck />
									Account
								</DropdownMenuItem>
							</Link>
							<Link
								to={"/notifications" as never}
								onClick={isMobile ? toggleSidebar : undefined}
							>
								<DropdownMenuItem>
									<Bell />
									Notifications
								</DropdownMenuItem>
							</Link>
							<Link
								to={"/account/tickets" as never}
								onClick={isMobile ? toggleSidebar : undefined}
							>
								<DropdownMenuItem>
									<LifeBuoy />
									Tickets
								</DropdownMenuItem>
							</Link>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						{current ? (
							<DropdownMenuItem
								onSelect={() => {
									if (isMobile) toggleSidebar();
									void logout(true);
								}}
							>
								<LogOut />
								Log out
							</DropdownMenuItem>
						) : (
							<Link
								to={"/login" as never}
								onClick={isMobile ? toggleSidebar : undefined}
							>
								<DropdownMenuItem>
									<LogOut />
									Log in
								</DropdownMenuItem>
							</Link>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
