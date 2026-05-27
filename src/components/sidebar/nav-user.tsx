import { BadgeCheck, Bell, ChevronsUpDown, LogOut } from "lucide-react"

import { useUser } from "@/components/contexts/UserContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link } from "@tanstack/react-router"

const getAvatar = (id: string | null | undefined): string | undefined => {
  if (!id) return undefined
  // TODO(phase-4): point at the storage_object proxy once S3 is migrated.
  // For now return the original Appwrite URL so migrated profiles still render.
  const apiUrl = import.meta.env.VITE_APPWRITE_URL
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
  if (!apiUrl || !projectId) return undefined
  return `${apiUrl}/v1/storage/buckets/avatars/files/${id}/preview?project=${projectId}&width=250&height=250&quality=50`
}

export function NavUser() {
  const { isMobile, toggleSidebar } = useSidebar()
  const { userData, current, logout } = useUser()

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
                  src={getAvatar(userData?.avatarId)}
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
                    src={getAvatar(userData?.avatarId)}
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
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {current ? (
              <DropdownMenuItem
                onSelect={() => {
                  if (isMobile) toggleSidebar()
                  void logout(true)
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
  )
}
