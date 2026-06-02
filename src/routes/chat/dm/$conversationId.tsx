import { createFileRoute } from "@tanstack/react-router";
import { MessagePane } from "@/components/chat/MessagePane";

export const Route = createFileRoute("/chat/dm/$conversationId")({
	component: DmPane,
});

function DmPane() {
	const { conversationId } = Route.useParams();
	return <MessagePane source={{ kind: "dm", conversationId }} />;
}
