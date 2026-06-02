import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export const Route = createFileRoute("/chat")({ component: ChatLayout });

function ChatLayout() {
	return (
		<div className="chat-scope flex h-svh w-full overflow-hidden bg-background text-foreground">
			<ChatSidebar />
			<main className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<Outlet />
			</main>
		</div>
	);
}
