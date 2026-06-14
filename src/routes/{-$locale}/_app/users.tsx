import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pager } from "@/components/Pager";
import { StorageImage } from "@/components/StorageImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useTranslations,
} from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/users")({
	component: UsersPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.usersTitle"),
			path: "/users",
			locale,
		});
	},
});

const PAGE_SIZE = 24;

function UsersPage() {
	const t = useTranslations("miscPages");
	const c = useTranslations("common");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	// One seed per visit so the backend shuffles consistently across pages.
	const [seed] = useState(() => Math.random().toString(36).slice(2, 12));
	// Reset to page 1 whenever the search changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run when search changes
	useEffect(() => setPage(1), [search]);

	const users = useQuery(
		orpc.profile.list.queryOptions({
			input: search.trim()
				? { search: search.trim(), page, pageSize: PAGE_SIZE }
				: { seed, page, pageSize: PAGE_SIZE },
		}),
	);
	const items = users.data?.items ?? [];

	return (
		<main className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">{t("usersTitle")}</h2>
			</div>
			<Input
				placeholder={t("usersSearchPlaceholder")}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			{users.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">{t("usersEmpty")}</p>
			) : (
				<>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{items.map((u) => (
							<Link
								key={u.userId}
								to={`/user/${u.profileUrl}` as never}
								className="block h-full"
							>
								<Card className="card-hover flex h-full flex-col">
									<CardHeader className="flex flex-row items-center gap-3">
										<StorageImage
											kind="avatar"
											fileId={u.avatarFileId}
											variant="sm"
											className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover bg-muted"
											fallback={
												<div className="h-12 w-12 shrink-0 rounded-lg border border-border bg-muted" />
											}
										/>
										<div className="min-w-0">
											<CardTitle className="text-base font-semibold truncate">
												{u.displayName || u.name || u.profileUrl}
											</CardTitle>
											<p className="text-xs text-muted-foreground truncate">
												@{u.profileUrl}
											</p>
										</div>
									</CardHeader>
									<CardContent className="flex flex-1 flex-col">
										{u.bio ? (
											<p className="text-sm line-clamp-2">{u.bio}</p>
										) : (
											<p className="text-xs text-muted-foreground">
												{t("usersNoBio")}
											</p>
										)}
										<p className="mt-auto pt-2 text-xs text-muted-foreground">
											{t("usersFollowersCount", { count: u.followersCount })}
										</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
					<Pager
						page={page}
						total={users.data?.total ?? 0}
						pageSize={PAGE_SIZE}
						onPageChange={setPage}
					/>
				</>
			)}
		</main>
	);
}
