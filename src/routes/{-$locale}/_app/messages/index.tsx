import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$locale}/_app/messages/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/{-$locale}/chat" as never,
			params: { locale: (params as { locale?: string }).locale } as never,
		});
	},
});
