import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import HeaderClient from "@/components/sidebar/header-client";

export const Route = createFileRoute("/{-$locale}/_app")({
	component: AppLayout,
});

function AppLayout() {
	const fullWidth = useMatches().some((m) => m.staticData.fullWidth);
	return (
		<HeaderClient
			containerClassName={fullWidth ? "flex min-h-0 w-full flex-1" : undefined}
			showFooter={!fullWidth}
		>
			<Outlet />
		</HeaderClient>
	);
}
