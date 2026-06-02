import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import HeaderClient from "@/components/sidebar/header-client";

export const Route = createFileRoute("/chat")({ component: ChatLayout });

function ChatLayout() {
	return (
		<div className="chat-scope">
			<HeaderClient sidebar={<ChatSidebar />} containerClassName="p-0">
				<Outlet />
			</HeaderClient>
		</div>
	);
}
