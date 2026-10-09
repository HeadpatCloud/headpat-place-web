import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { PawPrintIcon } from "lucide-react";
import { useState } from "react";
import { useAuthState } from "@/components/contexts/SessionHint";
import HomeSections from "@/components/home/HomeSections";
import { SECTION, SECTION_LINK } from "@/components/home/styles";
import { useDateFormat } from "@/lib/datetime";
import {
	DEFAULT_LOCALE,
	type Locale,
	useResolvedLocale,
	useTranslations,
} from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { SITE_NAME, SITE_URL, seo } from "@/lib/seo";

// Fetched during SSR so the first paint already has the lists and nothing
// shifts when they arrive. A failed or slow call just leaves that list for the
// client to fetch itself.
const loadHome = createIsomorphicFn()
	.server(async () => {
		const seed = Math.random().toString(36).slice(2, 12);
		const opts = { signal: AbortSignal.timeout(2000) };
		const [communities, users, events, gallery] = await Promise.allSettled([
			client.community.list({ pageSize: 6, seed }, opts),
			client.profile.list({ pageSize: 4, seed }, opts),
			client.event.upcoming({ limit: 3 }, opts),
			client.gallery.list({ page: 1, pageSize: 10 }, opts),
		]);
		const ok = <T,>(r: PromiseSettledResult<T>) =>
			r.status === "fulfilled" ? r.value : undefined;
		return {
			seed,
			communities: ok(communities),
			users: ok(users),
			events: ok(events),
			gallery: ok(gallery),
		};
	})
	.client(() => null);

export const Route = createFileRoute("/{-$locale}/_app/")({
	loader: () => loadHome(),
	component: Landing,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return {
			...seo({
				title: SITE_NAME,
				description:
					"Headpat - communities, a creative gallery, and events. Join the pack.",
				path: "/",
				locale,
			}),
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@graph": [
							{
								"@type": "Organization",
								"@id": `${SITE_URL}/#organization`,
								name: SITE_NAME,
								url: SITE_URL,
								logo: {
									"@type": "ImageObject",
									url: `${SITE_URL}/logos/icon_x512.webp`,
									width: 512,
									height: 512,
								},
								image: `${SITE_URL}/og-image.png`,
								email: "help@headpat.place",
								address: {
									"@type": "PostalAddress",
									streetAddress: "Friedhofsweg 10",
									postalCode: "49843",
									addressLocality: "Uelsen",
									addressRegion: "Lower Saxony",
									addressCountry: "DE",
								},
								contactPoint: {
									"@type": "ContactPoint",
									contactType: "customer support",
									email: "help@headpat.place",
									url: `${SITE_URL}/support`,
									availableLanguage: ["en", "de", "nl"],
								},
								sameAs: [
									"https://discord.gg/EaQTEKRg2A",
									"https://github.com/headpatcloud",
									"https://headpat.space",
								],
							},
							{
								"@type": "WebSite",
								"@id": `${SITE_URL}/#website`,
								name: SITE_NAME,
								url: SITE_URL,
								inLanguage: ["en", "de", "nl"],
								publisher: { "@id": `${SITE_URL}/#organization` },
								potentialAction: {
									"@type": "SearchAction",
									target: `${SITE_URL}/search?q={search_term_string}`,
									"query-input": "required name=search_term_string",
								},
							},
						],
					}),
				},
			],
		};
	},
});

function Landing() {
	const auth = useAuthState();
	const t = useTranslations("home");
	const fmt = useDateFormat();
	const locale = useResolvedLocale();
	// Same locale and zone on server and client, so the dates don't change at hydration.
	const dateIn = (d: Date, o: Intl.DateTimeFormatOptions) =>
		new Date(d).toLocaleDateString(locale, {
			timeZone: fmt.timeZone ?? "UTC",
			...o,
		});
	// New sample each visit; the API orders by md5(seed || id) so it stays
	// stable while this mount lives.
	const initial = Route.useLoaderData();
	const [seed] = useState(
		() => initial?.seed ?? Math.random().toString(36).slice(2, 12),
	);
	const communities = useQuery({
		...orpc.community.list.queryOptions({ input: { pageSize: 6, seed } }),
		initialData: initial?.communities,
	});
	const users = useQuery({
		...orpc.profile.list.queryOptions({ input: { pageSize: 4, seed } }),
		initialData: initial?.users,
	});
	const events = useQuery({
		...orpc.event.upcoming.queryOptions({ input: { limit: 3 } }),
		initialData: initial?.events,
	});
	const gallery = useQuery({
		...orpc.gallery.list.queryOptions({ input: { page: 1, pageSize: 10 } }),
		initialData: initial?.gallery,
	});
	const topCommunities = (communities.data?.items ?? []).slice(0, 6);
	const topUsers = (users.data?.items ?? []).slice(0, 4);
	const upcoming = (events.data ?? []).slice(0, 2);
	const fresh = (gallery.data?.items ?? []).filter((g) => !g.nsfw).slice(0, 5);
	const signedIn = auth.signedIn;

	return (
		<main className="space-y-5 pb-24 md:pb-0">
			<section className="grid gap-5 xl:grid-cols-4">
				<div className="relative flex min-h-64 xl:col-span-3 flex-col justify-center gap-3.5 overflow-hidden rounded-3xl bg-linear-to-r from-accent/15 via-accent/40 to-accent/15 p-8 sm:p-10">
					<PawPrintIcon
						aria-hidden
						className="absolute -right-8 -bottom-10 size-64 -rotate-12 text-foreground/10"
					/>
					<span className="relative self-start rounded-full bg-card/70 px-3.5 py-1.5 text-sm font-extrabold text-link">
						{t("heroTag")}
					</span>
					<h1 className="relative max-w-xl font-display text-3xl leading-tight font-semibold sm:text-5xl">
						{signedIn
							? `${t("welcomeBack")}, ${auth.name}`.trim()
							: t("guestTitle")}
					</h1>
					<p className="relative max-w-md text-lg font-semibold text-foreground/80">
						{t("heroText")}
					</p>
					<div className="relative mt-1.5 flex flex-wrap gap-2.5">
						<Link
							to={signedIn ? "/gallery" : "/login"}
							className="inline-flex min-h-11 items-center rounded-full bg-foreground px-6 py-3 text-base font-extrabold text-background"
						>
							{signedIn ? t("browseGallery") : t("logIn")}
						</Link>
						{signedIn ? (
							<Link
								to="/events/new"
								className="inline-flex min-h-11 items-center rounded-full bg-card/75 px-6 py-3 text-base font-extrabold"
							>
								{t("planEvent")}
							</Link>
						) : null}
					</div>
				</div>

				<div className={`${SECTION} flex flex-col gap-3.5`}>
					<div className="flex flex-wrap items-center justify-between gap-x-3">
						<h2 className="font-display text-lg font-semibold whitespace-nowrap">
							{t("upNext")}
						</h2>
						<Link
							to="/events"
							className={`${SECTION_LINK} shrink-0 whitespace-nowrap`}
						>
							{t("allEvents")}
						</Link>
					</div>
					{upcoming.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{t("noUpcomingEvents")}
						</p>
					) : (
						upcoming.map((e, i) => {
							const location =
								e.locationText ||
								(e.locationZoneMethod === "virtual" ? "Online" : "");
							const meta = [e.community?.name, location]
								.filter(Boolean)
								.join(" · ");
							return (
								<Link
									key={e.id}
									to={`/events/${e.id}`}
									className={`flex items-center gap-3.5 rounded-2xl p-3.5 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${i % 2 === 0 ? "bg-primary/10" : "bg-accent/20"}`}
								>
									<span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-card leading-none">
										<span className="text-xs font-extrabold tracking-wider text-link">
											{dateIn(e.startsAt, { month: "short" }).toUpperCase()}
										</span>
										<span className="mt-1 font-display text-2xl font-semibold">
											{dateIn(e.startsAt, { day: "numeric" })}
										</span>
									</span>
									<span className="min-w-0">
										<span className="block truncate font-extrabold">
											{e.title}
										</span>
										<span className="block truncate text-sm font-semibold text-muted-foreground">
											{meta}
										</span>
									</span>
								</Link>
							);
						})
					)}
				</div>
			</section>

			<HomeSections
				communities={topCommunities}
				users={topUsers}
				gallery={fresh}
			/>
		</main>
	);
}
