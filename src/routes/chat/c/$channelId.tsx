import { createFileRoute } from "@tanstack/react-router";
import { MessagePane } from "@/components/chat/MessagePane";

export const Route = createFileRoute("/chat/c/$channelId")({
	component: ChannelPane,
});

function ChannelPane() {
	const { channelId } = Route.useParams();
	return <MessagePane source={{ kind: "channel", channelId }} />;
}
