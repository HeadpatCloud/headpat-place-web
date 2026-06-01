import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import { PresenceProvider } from "@/components/contexts/PresenceProvider";
import { Toaster } from "@/components/ui/sonner";
import "../styles/globals.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			retry: 1,
		},
	},
});

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Headpat" },
			{
				name: "description",
				content:
					"Headpat.place — a social media platform for the next generation.",
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="bg-background flex min-h-screen antialiased font-sans">
				<QueryClientProvider client={queryClient}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<PresenceProvider>
							<div className="w-full">
								<Outlet />
							</div>
						</PresenceProvider>
						<Toaster />
					</ThemeProvider>
					{import.meta.env.DEV ? (
						<>
							<ReactQueryDevtools initialIsOpen={false} />
							<TanStackRouterDevtools position="bottom-right" />
						</>
					) : null}
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	);
}
