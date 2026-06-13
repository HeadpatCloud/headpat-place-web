import { ChevronsUpDown } from "lucide-react";
import * as React from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useTranslations } from "@/lib/i18n";

export type team = {
	name: string;
	activeName?: string;
	logoLight: string;
	logoDark: string;
	plan?: string;
	href: string;
};

/** Renders both logo variants and toggles via CSS so the correct one shows
 *  before first paint (next-themes sets the .dark class pre-hydration). */
function TeamLogo({ team }: { team: team }) {
	const t = useTranslations("commonUi");
	return (
		<>
			{/* eslint-disable-next-line jsx-a11y/alt-text */}
			<img
				src={team.logoLight}
				width={150}
				height={30}
				alt={t("logoAlt", { name: team.name })}
				draggable={false}
				className="block dark:hidden"
			/>
			{/* eslint-disable-next-line jsx-a11y/alt-text */}
			<img
				src={team.logoDark}
				width={150}
				height={30}
				alt={t("logoAlt", { name: team.name })}
				draggable={false}
				className="hidden dark:block"
			/>
		</>
	);
}

export function TeamSwitcher({ teams }: { teams: team[] }) {
	const t = useTranslations("commonUi");
	const { isMobile } = useSidebar();
	const activeTeam = teams[0];

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<TeamLogo team={activeTeam} />
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							{t("sites")}
						</DropdownMenuLabel>
						{teams
							.filter((team) => team.name !== activeTeam.name)
							.map((team) => (
								<a href={team.href} key={team.name}>
									<DropdownMenuItem
										key={team.name}
										className="focus:bg-muted focus-visible:ring-0"
									>
										<div className="flex items-center justify-center">
											<TeamLogo team={team} />
										</div>
									</DropdownMenuItem>
								</a>
							))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
