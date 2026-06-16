import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { MessagesPanel } from "./MessagesPanel";
import { QuickSwitcher } from "./QuickSwitcher";
import { ServerPanel } from "./ServerPanel";
import { ServerRail } from "./ServerRail";
import { SidebarUserPanel } from "./SidebarUserPanel";

type View = "messages" | { serverId: string };

export function ChatSidebar({ className }: { className?: string }) {
	const location = useLocation();

	const activeChannelId = useMemo(() => {
		const m = location.pathname.match(/\/chat\/c\/([^/]+)/);
		return m ? m[1] : null;
	}, [location.pathname]);
	const onDm = /\/chat\/dm\//.test(location.pathname);

	const activeChannel = useQuery({
		...orpc.channel.byId.queryOptions({
			input: { channelId: activeChannelId ?? "" },
		}),
		enabled: !!activeChannelId,
	});

	const [switcherOpen, setSwitcherOpen] = useState(false);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setSwitcherOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	// URL-derived view, overridable by clicking a rail icon (spec A.6).
	const [override, setOverride] = useState<View | null>(null);
	const urlView: View | null = onDm
		? "messages"
		: activeChannel.data?.communityId
			? { serverId: activeChannel.data.communityId }
			: null;

	// a navigation (URL change) clears the local preview override.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on path change only
	useEffect(() => {
		setOverride(null);
	}, [location.pathname]);

	const view: View = override ?? urlView ?? "messages";

	return (
		<aside
			className={cn(
				"flex h-full w-full shrink-0 border-r border-border bg-background md:w-[304px]",
				className,
			)}
		>
			<ServerRail
				view={view}
				onSelectMessages={() => setOverride("messages")}
				onSelectServer={(serverId) => setOverride({ serverId })}
			/>

			<div className="flex min-w-0 flex-1 flex-col">
				<Link
					to="/"
					className="flex h-13 shrink-0 items-center gap-2 border-b border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
				>
					<ChevronLeftIcon className="size-4 text-muted-foreground" />
					<span>headpat</span>
				</Link>

				<div className="min-h-0 flex-1">
					{view === "messages" ? (
						<MessagesPanel />
					) : (
						<ServerPanel
							communityId={view.serverId}
							activeChannelId={activeChannelId}
						/>
					)}
				</div>

				<SidebarUserPanel />
			</div>

			<QuickSwitcher open={switcherOpen} onOpenChange={setSwitcherOpen} />
		</aside>
	);
}
