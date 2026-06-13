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
import { ThemeController } from "@/components/contexts/ThemeController";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider, useResolvedLocale } from "@/lib/i18n";
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
			{ name: "theme-color", content: "#0a0a0a" },
			{ property: "og:site_name", content: "Headpat" },
			{ name: "twitter:card", content: "summary" },
		],
		links: [
			{ rel: "manifest", href: "/site.webmanifest" },
			{ rel: "icon", href: "/logos/hp_logo_x256.webp", type: "image/webp" },
			{ rel: "apple-touch-icon", href: "/logos/hp_logo_x256.webp" },
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	const locale = useResolvedLocale();
	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<HeadContent />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint theme application
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var a=localStorage.getItem('hp-active-theme')||'headpat';var s=a.indexOf('custom:')===0?'custom-'+a.slice(7):a;document.documentElement.dataset.theme=s;if(a.indexOf('custom:')===0){var css=localStorage.getItem('hp-active-theme-css');if(css){var el=document.createElement('style');el.id='hp-active-custom';el.textContent=css;document.head.appendChild(el);}}}catch(e){}})();`,
					}}
				/>
			</head>
			<body className="bg-background flex min-h-screen antialiased font-sans">
				<QueryClientProvider client={queryClient}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<ThemeController>
							<LocaleProvider locale={locale}>
								<PresenceProvider>
									<div className="w-full">
										<Outlet />
									</div>
								</PresenceProvider>
								<Toaster />
							</LocaleProvider>
						</ThemeController>
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
