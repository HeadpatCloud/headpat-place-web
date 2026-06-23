import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pager } from "@/components/Pager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDateFormat } from "@/lib/datetime";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useTranslations,
} from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { htmlToText } from "@/lib/rich-text";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/announcements/")({
	component: AnnouncementsPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.announcementsTitle"),
			path: "/announcements",
			locale,
		});
	},
});

const PAGE_SIZE = 24;

function AnnouncementsPage() {
	const [page, setPage] = useState(1);
	const t = useTranslations("miscPages");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const list = useQuery(
		orpc.announcement.list.queryOptions({
			input: { page, pageSize: PAGE_SIZE },
		}),
	);
	const items = list.data?.items ?? [];

	return (
		<main className="space-y-4">
			<h2 className="text-2xl font-bold">{t("announcementsTitle")}</h2>
			{list.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : items.length === 0 ? (
				<p className="text-muted-foreground">{t("announcementsEmpty")}</p>
			) : (
				<>
					<div className="space-y-3">
						{items.map((a) => (
							<Link key={a.id} to={`/announcements/${a.id}` as never}>
								<Card className="hover:bg-accent transition-colors">
									{a.title ? (
										<CardHeader>
											<CardTitle>{a.title}</CardTitle>
										</CardHeader>
									) : null}
									<CardContent>
										<p className="line-clamp-3">{htmlToText(a.description)}</p>
										<p className="text-xs text-muted-foreground mt-1">
											{fmt.date(a.createdAt)}
										</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
					<Pager
						page={page}
						total={list.data?.total ?? 0}
						pageSize={PAGE_SIZE}
						onPageChange={setPage}
					/>
				</>
			)}
		</main>
	);
}
