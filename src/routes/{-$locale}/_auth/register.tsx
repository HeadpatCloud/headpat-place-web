import { createFileRoute, redirect } from "@tanstack/react-router";

// The login route handles both login and registration via an in-page toggle.
// `/register` simply lands on `/login` so existing inbound links keep working.
export const Route = createFileRoute("/{-$locale}/_auth/register")({
	beforeLoad: () => {
		throw redirect({ to: "/login" as never });
	},
});
