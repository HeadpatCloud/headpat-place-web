import type { AdultLookingFor, LookingFor } from "@backend/lib/discovery";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MapPinIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NearbyPanel } from "@/components/map/NearbyPanel";
import { currentPosition, NEARBY_REFRESH_MS } from "@/components/map/nearby";
import { StorageImage } from "@/components/StorageImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";
import { useBlurAdult } from "@/lib/blur-adult";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useLocale,
	useTranslations,
} from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { seo } from "@/lib/seo";
import { useDebounced } from "@/lib/use-debounced";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/{-$locale}/_app/nearby")({
	component: NearbyPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "nav.nearby"),
			path: "/nearby",
			locale,
		});
	},
});

type Sort = "nearest" | "recent";
type AnyLookingFor = LookingFor | AdultLookingFor;
type Near = { lat: number; lng: number };

// Rounded so small GPS wobble doesn't refetch; ~100 m is finer than any cell.
function roundNear(p: Near): Near {
	return {
		lat: Math.round(p.lat * 1000) / 1000,
		lng: Math.round(p.lng * 1000) / 1000,
	};
}

const DOT: Record<string, string> = {
	online: "bg-emerald-500",
	away: "bg-amber-500",
	dnd: "bg-red-500",
};

function NearbyPage() {
	const t = useTranslations("nearbyPage");
	const locale = useLocale();
	const { data: session, isPending } = useSession();
	const signedIn = !!session?.user;

	const [near, setNear] = useState<Near | null>(null);
	const [locating, setLocating] = useState(false);
	const [locationFailed, setLocationFailed] = useState(false);
	const locate = () => {
		setLocating(true);
		currentPosition()
			.then((p) => {
				setNear(roundNear(p));
				setLocationFailed(false);
			})
			.catch(() => setLocationFailed(true))
			.finally(() => setLocating(false));
	};
	// biome-ignore lint/correctness/useExhaustiveDependencies: locate once when signed in
	useEffect(() => {
		if (signedIn) locate();
	}, [signedIn]);

	const [sort, setSort] = useState<Sort>("nearest");
	const [onlineOnly, setOnlineOnly] = useState(false);
	const [eventId, setEventId] = useState<string | null>(null);
	const [mode, setMode] = useState<"all" | "adult">("all");
	const [lookingFor, setLookingFor] = useState<AnyLookingFor | null>(null);
	const [interestDraft, setInterestDraft] = useState("");
	const interest = useDebounced(interestDraft.trim().toLowerCase(), 300);
	const d = useTranslations("discovery");
	const mine = useQuery({
		...orpc.discovery.mine.queryOptions({ input: {} }),
		enabled: signedIn,
	});
	const options = useQuery(orpc.discovery.options.queryOptions());
	const canAdult = mine.data?.canAdult === true;
	const blurAdult = useBlurAdult();
	const lookingForOptions: readonly AnyLookingFor[] =
		mode === "adult"
			? (options.data?.adultLookingFor ?? [])
			: (options.data?.lookingFor ?? []);

	const list = useQuery({
		...orpc.nearby.list.queryOptions({
			input: {
				near: near ?? undefined,
				sort,
				mode,
				interest: interest || undefined,
				lookingFor: lookingFor ?? undefined,
			},
		}),
		enabled: signedIn,
		refetchInterval: NEARBY_REFRESH_MS,
	});
	const people = list.data ?? [];

	const ids = useMemo(
		() => people.slice(0, 200).map((p) => p.userId),
		[people],
	);
	const presence = useQuery({
		...orpc.presence.getMany.queryOptions({ input: { userIds: ids } }),
		enabled: ids.length > 0,
		staleTime: 30_000,
	});
	const statusOf = (id: string) => presence.data?.[id]?.status ?? "offline";

	// events present in the list become filter buttons
	const events = useMemo(() => {
		const m = new Map<string, string>();
		for (const p of people)
			if (p.eventId && p.eventTitle) m.set(p.eventId, p.eventTitle);
		return [...m.entries()];
	}, [people]);

	const shown = people.filter(
		(p) =>
			(!onlineOnly || statusOf(p.userId) !== "offline") &&
			(!eventId || p.eventId === eventId),
	);

	const chip = (active: boolean) =>
		cn(
			"rounded-full border px-3 py-1 text-sm transition-colors",
			active
				? "border-primary bg-primary text-primary-foreground"
				: "border-border bg-card hover:bg-muted",
		);

	if (!isPending && !signedIn) {
		return (
			<main className="space-y-2">
				<p className="font-display text-2xl font-bold">{t("title")}</p>
				<p className="text-muted-foreground">{t("signIn")}</p>
			</main>
		);
	}

	return (
		<main className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p className="font-display text-2xl font-bold">{t("title")}</p>
					<p className="text-sm text-muted-foreground">{t("subtitle")}</p>
				</div>
				<NearbyPanel />
			</div>

			{canAdult ? (
				<div className="inline-flex rounded-full border border-border bg-card p-1">
					{(["all", "adult"] as const).map((m) => (
						<button
							key={m}
							type="button"
							aria-pressed={mode === m}
							onClick={() => {
								setMode(m);
								setLookingFor(null);
							}}
							className={cn(
								"rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
								mode === m
									? m === "adult"
										? "bg-destructive text-white"
										: "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{m === "adult" ? t("modeAdult") : t("modeAll")}
						</button>
					))}
				</div>
			) : null}

			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					className={chip(sort === "nearest")}
					onClick={() => setSort("nearest")}
					aria-pressed={sort === "nearest"}
				>
					{t("sortNearest")}
				</button>
				<button
					type="button"
					className={chip(sort === "recent")}
					onClick={() => setSort("recent")}
					aria-pressed={sort === "recent"}
				>
					{t("sortRecent")}
				</button>
				<span className="mx-1 h-5 w-px bg-border" />
				<button
					type="button"
					className={chip(onlineOnly)}
					onClick={() => setOnlineOnly((v) => !v)}
					aria-pressed={onlineOnly}
				>
					{t("filterOnline")}
				</button>
				{events.map(([id, title]) => (
					<button
						key={id}
						type="button"
						className={chip(eventId === id)}
						onClick={() => setEventId((cur) => (cur === id ? null : id))}
						aria-pressed={eventId === id}
					>
						{t("filterEvent", { event: title })}
					</button>
				))}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{lookingForOptions.map((k) => (
					<button
						key={k}
						type="button"
						className={chip(lookingFor === k)}
						aria-pressed={lookingFor === k}
						onClick={() => setLookingFor((cur) => (cur === k ? null : k))}
					>
						{d(`${mode === "adult" ? "adultLookingFor" : "lookingFor"}.${k}`)}
					</button>
				))}
				<Input
					value={interestDraft}
					onChange={(e) => setInterestDraft(e.target.value)}
					placeholder={mode === "adult" ? t("filterInto") : t("filterInterest")}
					aria-label={mode === "adult" ? t("filterInto") : t("filterInterest")}
					maxLength={32}
					className="h-8 w-44 rounded-full"
				/>
			</div>

			{locationFailed && sort === "nearest" ? (
				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
					<MapPinIcon className="size-4 text-muted-foreground" />
					<span className="flex-1 text-muted-foreground">
						{t("noLocation")}
					</span>
					<Button
						size="sm"
						variant="secondary"
						onClick={locate}
						disabled={locating}
					>
						{t("tryLocation")}
					</Button>
				</div>
			) : null}

			{list.isPending ? (
				<p className="text-muted-foreground">{t("loading")}</p>
			) : shown.length === 0 ? (
				<div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
					<p className="font-semibold">{t("empty")}</p>
					<p className="mt-1 text-sm text-muted-foreground">{t("emptyHint")}</p>
				</div>
			) : (
				<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
					{shown.map((p) => {
						const name = p.displayName || p.name || p.profileUrl || "?";
						const status = statusOf(p.userId);
						const distance =
							p.distanceKm === null
								? null
								: p.precision === "precise"
									? t("distance", { km: p.distanceKm.toLocaleString(locale) })
									: t("distanceRough", {
											km: p.distanceKm.toLocaleString(locale),
										});
						return (
							<Link
								key={p.userId}
								to={`/user/${p.profileUrl}` as never}
								className="group relative block aspect-square overflow-hidden rounded-xl border border-border bg-muted"
							>
								<StorageImage
									kind="avatar"
									fileId={p.avatarFileId}
									className={cn(
										"h-full w-full object-cover transition-[scale] group-hover:scale-105",
										// 18+ pictures stay blurred in the grid; the profile shows them
										mode === "adult" &&
											blurAdult &&
											"scale-110 blur-xl group-hover:scale-110",
									)}
									fallback={
										<div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted-foreground">
											{name.charAt(0).toUpperCase()}
										</div>
									}
								/>
								<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5 text-white">
									<p className="flex items-center gap-1.5 truncate text-sm font-semibold">
										{DOT[status] ? (
											<span
												className={cn(
													"size-2 shrink-0 rounded-full",
													DOT[status],
												)}
											/>
										) : null}
										<span className="truncate">{name}</span>
									</p>
									<p className="truncate text-[11px] opacity-80">
										{distance ?? p.eventTitle ?? t("somewhere")}
									</p>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</main>
	);
}
