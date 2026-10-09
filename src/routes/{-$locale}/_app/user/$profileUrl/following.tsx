import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pager } from "@/components/Pager";
import { UserCard } from "@/components/UserCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";

import { pageHead } from "@/lib/seo";
export const Route = createFileRoute(
	"/{-$locale}/_app/user/$profileUrl/following",
)({
	head: pageHead("titles.following", "/users", { noindex: true }),
	component: FollowingPage,
});

const PAGE_SIZE = 30;

function FollowingPage() {
	const { profileUrl } = Route.useParams();
	const t = useTranslations("miscPages");
	const c = useTranslations("common");
	const [page, setPage] = useState(1);
	const profile = useQuery(
		orpc.profile.byUrl.queryOptions({ input: { profileUrl } }),
	);
	const following = useQuery({
		...orpc.follow.following.queryOptions({
			input: { userId: profile.data?.userId ?? "", page, pageSize: PAGE_SIZE },
		}),
		enabled: !!profile.data?.userId,
	});

	if (profile.isPending)
		return <p className="p-4 text-muted-foreground">{c("loading")}</p>;
	if (profile.isError || !profile.data)
		return <p className="p-4">{t("profileNotFound")}</p>;

	const name = profile.data.displayName || profile.data.profileUrl;
	const items = following.data?.items ?? [];

	return (
		<main>
			<Card>
				<CardHeader>
					<CardTitle>{t("followingTitle", { name })}</CardTitle>
				</CardHeader>
				<CardContent>
					{following.isPending ? (
						<p className="text-muted-foreground">{c("loading")}</p>
					) : items.length === 0 ? (
						<p className="text-muted-foreground">{t("followingEmpty")}</p>
					) : (
						<>
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
								{items.map((u) => (
									<UserCard key={u.userId} user={u} />
								))}
							</div>
							<Pager
								page={page}
								total={following.data?.total ?? 0}
								pageSize={PAGE_SIZE}
								onPageChange={setPage}
							/>
						</>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
