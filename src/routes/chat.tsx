import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export const Route = createFileRoute("/chat")({ component: ChatLayout });

function ChatLayout() {
	const location = useLocation();
	const hasActive = /\/chat\/(dm|c)\//.test(location.pathname);
	return (
		<div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
			<ChatSidebar className={hasActive ? "hidden md:flex" : "flex"} />
			<main
				className={`min-w-0 flex-1 flex-col overflow-hidden ${
					hasActive ? "flex" : "hidden md:flex"
				}`}
			>
				<Outlet />
			</main>
		</div>
	);
}
