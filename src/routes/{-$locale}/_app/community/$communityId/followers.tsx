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
	"/{-$locale}/_app/community/$communityId/followers",
)({
	head: pageHead("titles.followers", "/community", { noindex: true }),
	component: CommunityFollowersPage,
});

const PAGE_SIZE = 30;

function CommunityFollowersPage() {
	const t = useTranslations("communityPages");
	const { communityId } = Route.useParams();
	const [page, setPage] = useState(1);
	const followers = useQuery(
		orpc.community.followers.queryOptions({
			input: { communityId, page, pageSize: PAGE_SIZE },
		}),
	);
	const items = followers.data?.items ?? [];

	return (
		<main>
			<Card>
				<CardHeader>
					<CardTitle>{t("members")}</CardTitle>
				</CardHeader>
				<CardContent>
					{followers.isPending ? (
						<p className="text-muted-foreground">{t("loading")}</p>
					) : items.length === 0 ? (
						<p className="text-muted-foreground">{t("noMembersYet")}</p>
					) : (
						<>
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
								{items.map((u) => (
									<UserCard key={u.userId} user={u} />
								))}
							</div>
							<Pager
								page={page}
								total={followers.data?.total ?? 0}
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
