import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/{-$locale}/_app/messages/$conversationId",
)({
	beforeLoad: ({ params }) => {
		const p = params as { locale?: string; conversationId: string };
		throw redirect({
			to: "/{-$locale}/chat/dm/$conversationId" as never,
			params: { locale: p.locale, conversationId: p.conversationId } as never,
		});
	},
});
