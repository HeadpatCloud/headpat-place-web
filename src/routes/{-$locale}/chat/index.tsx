import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$locale}/chat/")({ component: ChatIndex });

function ChatIndex() {
	return (
		<div className="flex h-svh items-center justify-center px-6 text-center">
			<p className="text-muted-foreground">
				Pick a conversation or channel to start chatting.
			</p>
		</div>
	);
}
