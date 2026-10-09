import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { StorageImage } from "@/components/StorageImage";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

const TYPES = ["all", "profiles", "communities", "events", "gallery"] as const;
type SearchType = (typeof TYPES)[number];

export const Route = createFileRoute("/{-$locale}/_app/search")({
	validateSearch: (s: Record<string, unknown>) => ({
		q: typeof s.q === "string" ? s.q : "",
		type: TYPES.includes(s.type as SearchType)
			? (s.type as SearchType)
			: undefined,
	}),
	head: pageHead("searchPage.title", "/search", { noindex: true }),
	component: SearchPage,
});

const SECTION = "rounded-3xl border border-border bg-card p-6 shadow-sm";

function SearchPage() {
	const t = useTranslations("searchPage");
	const { q, type: urlType } = Route.useSearch();
	// Tabs follow the click at once; the URL catches up behind it.
	const [picked, setPicked] = useState<SearchType | null>(null);
	const type = picked ?? urlType ?? "all";
	useEffect(() => {
		if (picked === (urlType ?? "all")) setPicked(null);
	}, [picked, urlType]);
	const navigate = useNavigate();
	const fmt = useDateFormat();
	const [text, setText] = useState(q);
	useEffect(() => setText(q), [q]);

	const term = q.trim();
	const results = useQuery({
		...orpc.search.query.queryOptions({
			input: { q: term || " ", type, limit: type === "all" ? 6 : 24 },
		}),
		enabled: term.length > 0,
		placeholderData: keepPreviousData,
	});
	const data = results.data;
	const total =
		(data?.profiles.length ?? 0) +
		(data?.communities.length ?? 0) +
		(data?.events.length ?? 0) +
		(data?.gallery.length ?? 0);

	function go(next: { q?: string; type?: SearchType }) {
		if (next.type) setPicked(next.type);
		navigate({
			to: "/search",
			search: { q: next.q ?? q, type: next.type ?? type },
			replace: true,
		} as never);
	}

	const tabs: { key: SearchType; label: string }[] = [
		{ key: "all", label: t("all") },
		{ key: "profiles", label: t("people") },
		{ key: "communities", label: t("communities") },
		{ key: "events", label: t("events") },
		{ key: "gallery", label: t("gallery") },
	];

	function SectionHead({ title, kind }: { title: string; kind: SearchType }) {
		return (
			<div className="flex items-center justify-between">
				<h2 className="font-display text-xl font-semibold">{title}</h2>
				{type === "all" ? (
					<button
						type="button"
						onClick={() => go({ type: kind })}
						className="text-sm font-extrabold text-link hover:underline"
					>
						{t("showAll")}
					</button>
				) : null}
			</div>
		);
	}

	return (
		<main className="space-y-5 pb-24 md:pb-0">
			<form
				className="flex h-12 items-center gap-3 rounded-full border border-border bg-card px-5 shadow-sm"
				onSubmit={(e) => {
					e.preventDefault();
					go({ q: text.trim() });
				}}
			>
				<SearchIcon
					className="size-5 shrink-0 text-muted-foreground"
					aria-hidden
				/>
				<input
					type="search"
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder={t("placeholder")}
					aria-label={t("title")}
					className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
				/>
			</form>

			<div className="flex flex-wrap gap-2">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => go({ type: tab.key })}
						aria-pressed={type === tab.key}
						className={cn(
							"rounded-full px-4 py-2 text-sm font-extrabold transition-colors",
							type === tab.key
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:text-foreground",
						)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{!term ? (
				<p className="text-muted-foreground">{t("prompt")}</p>
			) : results.isPending ? (
				<p className="text-muted-foreground">{t("searching")}</p>
			) : total === 0 ? (
				<p className="text-muted-foreground">{t("empty", { q: term })}</p>
			) : (
				<>
					{data && data.profiles.length > 0 ? (
						<section className={cn(SECTION, "space-y-3")}>
							<SectionHead title={t("people")} kind="profiles" />
							<div className="grid gap-2 sm:grid-cols-2">
								{data.profiles.map((u) => (
									<Link
										key={u.userId}
										to={`/user/${u.profileUrl}`}
										className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted"
									>
										<StorageImage
											kind="avatar"
											fileId={u.avatarFileId}
											variant="sm"
											className="size-11 shrink-0 rounded-full bg-muted object-cover"
											fallback={
												<span className="size-11 shrink-0 rounded-full bg-muted" />
											}
										/>
										<span className="min-w-0">
											<span className="block truncate font-extrabold">
												{u.displayName || u.name || u.profileUrl}
											</span>
											<span className="block truncate text-sm font-semibold text-muted-foreground">
												@{u.profileUrl}
											</span>
										</span>
									</Link>
								))}
							</div>
						</section>
					) : null}

					{data && data.communities.length > 0 ? (
						<section className={cn(SECTION, "space-y-3")}>
							<SectionHead title={t("communities")} kind="communities" />
							<div className="grid gap-2 sm:grid-cols-2">
								{data.communities.map((c) => (
									<Link
										key={c.id}
										to={`/community/${c.id}`}
										className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted"
									>
										<StorageImage
											kind="community-avatar"
											fileId={c.avatarFileId}
											variant="sm"
											className="size-12 shrink-0 rounded-2xl bg-muted object-cover"
											fallback={
												<span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary font-display text-lg font-semibold text-primary-foreground">
													{c.name.charAt(0).toUpperCase()}
												</span>
											}
										/>
										<span className="min-w-0">
											<span className="block truncate font-extrabold">
												{c.name}
											</span>
											<span className="block truncate text-sm font-semibold text-muted-foreground">
												{t("followers", { count: c.followersCount })}
											</span>
										</span>
									</Link>
								))}
							</div>
						</section>
					) : null}

					{data && data.events.length > 0 ? (
						<section className={cn(SECTION, "space-y-3")}>
							<SectionHead title={t("events")} kind="events" />
							<div className="grid gap-2 sm:grid-cols-2">
								{data.events.map((e) => (
									<Link
										key={e.id}
										to={`/events/${e.id}`}
										className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted"
									>
										<span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 leading-none">
											<span className="text-xs font-extrabold tracking-wider text-link">
												{fmt.date(e.startsAt, { month: "short" }).toUpperCase()}
											</span>
											<span className="mt-0.5 font-display text-lg font-semibold">
												{fmt.date(e.startsAt, { day: "numeric" })}
											</span>
										</span>
										<span className="min-w-0">
											<span className="block truncate font-extrabold">
												{e.title}
											</span>
											<span className="block truncate text-sm font-semibold text-muted-foreground">
												{e.locationText ||
													(e.locationZoneMethod === "virtual" ? "Online" : "")}
											</span>
										</span>
									</Link>
								))}
							</div>
						</section>
					) : null}

					{data && data.gallery.length > 0 ? (
						<section className={cn(SECTION, "space-y-3")}>
							<SectionHead title={t("gallery")} kind="gallery" />
							<div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
								{data.gallery.map((g) => (
									<Link
										key={g.id}
										to={`/gallery/${g.id}`}
										aria-label={g.name}
										className="block aspect-4/5 overflow-hidden rounded-2xl bg-muted transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
									>
										<ResponsiveImage
											kind="gallery"
											fileId={g.fileId}
											alt={g.name}
											sizes="(min-width:1024px) 16vw, (min-width:640px) 33vw, 50vw"
											className="size-full object-cover"
										/>
									</Link>
								))}
							</div>
						</section>
					) : null}
				</>
			)}
		</main>
	);
}
