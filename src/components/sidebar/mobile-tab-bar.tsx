import {
	CalendarIcon,
	HomeIcon,
	LayoutPanelLeftIcon,
	MenuIcon,
	MessagesSquareIcon,
} from "lucide-react";
import { useAuthState } from "@/components/contexts/SessionHint";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { useSidebar } from "../ui/sidebar";

const tabClass =
	"flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold text-muted-foreground";

export function MobileTabBar() {
	const nav = useTranslations("nav");
	const c = useTranslations("commonUi");
	const { toggleSidebar } = useSidebar();
	const { signedIn, pending } = useAuthState();
	const signedOut = !pending && !signedIn;
	const tabs = [
		{ name: nav("home"), url: "/", icon: HomeIcon },
		{ name: nav("gallery"), url: "/gallery", icon: LayoutPanelLeftIcon },
		{ name: nav("events"), url: "/events", icon: CalendarIcon },
		{
			name: nav("chat"),
			url: "/chat",
			icon: MessagesSquareIcon,
			disabled: signedOut,
		},
	];
	return (
		<nav
			aria-label={c("primaryNav")}
			className="fixed inset-x-3 bottom-3 z-30 flex gap-1 rounded-3xl border border-border bg-card p-2 shadow-lg md:hidden"
		>
			{tabs.map((tab) =>
				tab.disabled ? (
					<button
						key={tab.name}
						type="button"
						disabled
						className={`${tabClass} opacity-40`}
					>
						<tab.icon className="size-5.5" />
						{tab.name}
					</button>
				) : (
					<Link
						key={tab.name}
						to={tab.url}
						className={tabClass}
						activeOptions={{ exact: tab.url === "/" }}
						activeProps={{ className: "bg-primary/15 text-link" }}
					>
						<tab.icon className="size-5.5" />
						{tab.name}
					</Link>
				),
			)}
			<button type="button" onClick={toggleSidebar} className={tabClass}>
				<MenuIcon className="size-5.5" />
				{c("moreTab")}
			</button>
		</nav>
	);
}
