import { createFileRoute, Outlet } from "@tanstack/react-router";
import HeaderClient from "@/components/sidebar/header-client";

export const Route = createFileRoute("/{-$locale}/_app")({
	component: AppLayout,
});

function AppLayout() {
	return (
		<HeaderClient>
			<Outlet />
		</HeaderClient>
	);
}
