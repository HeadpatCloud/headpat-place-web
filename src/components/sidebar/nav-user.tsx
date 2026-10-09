import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	LifeBuoy,
	LogIn,
	LogOut,
} from "lucide-react";
import { useAuthState } from "@/components/contexts/SessionHint";
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
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { navUserMode } from "./nav-user-mode";

export function NavUser() {
	const t = useTranslations("commonUi");
	const { isMobile, toggleSidebar } = useSidebar();
	const { userData, logout } = useUser();
	const auth = useAuthState();
	const avatarUrl = useStorageUrl(
		"avatar",
		userData?.avatarId ?? auth.avatar,
		"md",
	).data?.url;
	const displayName = userData?.displayName || userData?.$id || auth.name;
	const mode = navUserMode({
		isPending: auth.pending,
		signedIn: auth.signedIn,
	});

	if (mode !== "signed-in") {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						asChild={mode === "signed-out"}
						className="rounded-2xl bg-background"
					>
						{mode === "signed-out" ? (
							<Link
								to={"/login" as never}
								onClick={isMobile ? toggleSidebar : undefined}
							>
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarFallback className="rounded-lg">
										<LogIn className="size-4" />
									</AvatarFallback>
								</Avatar>
								<span className="truncate font-medium">{t("logIn")}</span>
							</Link>
						) : (
							<>
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarFallback className="rounded-lg" />
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="h-4 w-24 animate-pulse rounded bg-sidebar-accent" />
								</div>
							</>
						)}
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="rounded-2xl bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="size-10 rounded-full">
								<AvatarImage src={avatarUrl} alt={displayName} />
								<AvatarFallback className="rounded-full">
									{displayName.charAt(0) || "HI"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-extrabold">{displayName}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
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
									<AvatarImage src={avatarUrl} alt={displayName} />
									<AvatarFallback className="rounded-lg">
										{displayName.charAt(0) || "HI"}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{displayName}</span>
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
									{t("account")}
								</DropdownMenuItem>
							</Link>
							<Link
								to={"/notifications" as never}
								onClick={isMobile ? toggleSidebar : undefined}
							>
								<DropdownMenuItem>
									<Bell />
									{t("notifications")}
								</DropdownMenuItem>
							</Link>
							<Link
								to={"/account/tickets" as never}
								onClick={isMobile ? toggleSidebar : undefined}
							>
								<DropdownMenuItem>
									<LifeBuoy />
									{t("tickets")}
								</DropdownMenuItem>
							</Link>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={() => {
								if (isMobile) toggleSidebar();
								void logout(true);
							}}
						>
							<LogOut />
							{t("logOut")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
