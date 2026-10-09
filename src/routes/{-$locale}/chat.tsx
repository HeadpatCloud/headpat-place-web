import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useSession } from "@/lib/auth-client";
import { useLocalizedNavigate } from "@/lib/localized-nav";

import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/{-$locale}/chat")({
	head: pageHead("nav.chat", "/chat", { noindex: true }),
	component: ChatLayout,
});

function ChatLayout() {
	const location = useLocation();
	const navigate = useLocalizedNavigate();
	const { data: session, isPending } = useSession();
	// only redirect once the session has resolved — never bounce a logged-in
	// user while the session is still loading.
	const loggedOut = !isPending && !session?.user;

	useEffect(() => {
		if (loggedOut) navigate({ to: "/login" as never });
	}, [loggedOut, navigate]);

	if (loggedOut) return null;

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
