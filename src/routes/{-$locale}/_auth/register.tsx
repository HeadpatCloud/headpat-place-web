import { createFileRoute, redirect } from "@tanstack/react-router";

// The login route handles both login and registration via an in-page toggle.
// `/register` simply lands on `/login` so existing inbound links keep working.
export const Route = createFileRoute("/{-$locale}/_auth/register")({
	beforeLoad: ({ params }) => {
		const locale = (params as { locale?: string }).locale;
		throw redirect({
			to: "/{-$locale}/login" as never,
			params: { locale } as never,
		});
	},
});
