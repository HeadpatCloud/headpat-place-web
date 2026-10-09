import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { ThemeProvider } from "next-themes";
import { PresenceProvider } from "@/components/contexts/PresenceProvider";
import {
	SessionHintProvider,
	SessionHintSync,
} from "@/components/contexts/SessionHint";
import { ThemeController } from "@/components/contexts/ThemeController";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider, useResolvedLocale } from "@/lib/i18n";
import { parseHint } from "@/lib/session-hint";
import fredokaLatin from "../../node_modules/@fontsource-variable/fredoka/files/fredoka-latin-wght-normal.woff2?url";
import nunitoLatin from "../../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2?url";
import "../styles/globals.css";

const readHint = createIsomorphicFn()
	.server(() => parseHint(getRequestHeader("cookie")))
	.client(() => parseHint(document.cookie));

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			retry: 1,
		},
	},
});

export const Route = createRootRoute({
	beforeLoad: () => ({ hint: readHint() }),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Headpat" },
			{
				name: "description",
				content:
					"Headpat.place - a social media platform for the next generation.",
			},
			{ name: "theme-color", content: "#0a0a0a" },
			{ property: "og:site_name", content: "Headpat" },
			{ name: "twitter:card", content: "summary" },
		],
		links: [
			{ rel: "manifest", href: "/site.webmanifest" },
			{ rel: "icon", href: "/logos/icon_x256.webp", type: "image/webp" },
			{ rel: "apple-touch-icon", href: "/logos/icon_x180.png" },
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	const locale = useResolvedLocale();
	const { hint } = Route.useRouteContext();
	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				{[nunitoLatin, fredokaLatin].map((href) => (
					<link
						key={href}
						rel="preload"
						as="font"
						type="font/woff2"
						href={href}
						crossOrigin="anonymous"
						fetchPriority="high"
					/>
				))}
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
							<SessionHintProvider value={hint}>
								<SessionHintSync />
								<LocaleProvider locale={locale}>
									<PresenceProvider>
										<div className="w-full">
											<Outlet />
										</div>
									</PresenceProvider>
									<Toaster />
								</LocaleProvider>
							</SessionHintProvider>
						</ThemeController>
					</ThemeProvider>
				</QueryClientProvider>
				<Scripts />
			</body>
		</html>
	);
}
