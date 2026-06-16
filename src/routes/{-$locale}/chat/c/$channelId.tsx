import { createFileRoute } from "@tanstack/react-router";
import { MessagePane } from "@/components/chat/MessagePane";

export const Route = createFileRoute("/{-$locale}/chat/c/$channelId")({
	component: ChannelPane,
});

function ChannelPane() {
	const { channelId } = Route.useParams();
	return (
		<MessagePane key={channelId} source={{ kind: "channel", channelId }} />
	);
}
