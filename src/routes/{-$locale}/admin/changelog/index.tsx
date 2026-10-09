import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pager } from "@/components/Pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/changelog/")({
	component: ChangelogAdmin,
});

const pageSize = 24;

function ChangelogAdmin() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const navigate = useNavigate();
	const fmt = useDateFormat();
	const [page, setPage] = useState(1);
	const list = useQuery(
		orpc.changelog.adminList.queryOptions({ input: { page, pageSize } }),
	);

	const create = useMutation({
		mutationFn: () =>
			client.changelog.adminUpsert({ title: "Untitled release", draft: true }),
		onSuccess: (r) => {
			qc.invalidateQueries({ queryKey: orpc.changelog.adminList.key() });
			navigate({ to: `/admin/changelog/${r.id}` as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="font-display text-3xl font-semibold tracking-tight">
					{t("changelog")}
				</h1>
				<Button
					onClick={() => create.mutate()}
					disabled={create.isPending}
					className="bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{t("newEntry")}
				</Button>
			</div>

			{list.isError ? (
				<p className="text-muted-foreground">{t("noAccess")}</p>
			) : list.isPending ? (
				<p className="text-muted-foreground">{c("loading")}</p>
			) : (
				<>
					<div className="space-y-2">
						{list.data.items.map((c) => (
							<Link
								key={c.id}
								to={`/admin/changelog/${c.id}` as never}
								className="block"
							>
								<Card className="card-hover flex items-center justify-between p-3">
									<span className="font-semibold">
										{c.title}
										{c.version ? (
											<span className="ml-2 text-xs text-muted-foreground">
												v{c.version}
											</span>
										) : null}
									</span>
									<span className="flex items-center gap-2">
										{c.draft ? (
											<Badge variant="secondary">{t("statusDraft")}</Badge>
										) : (
											<Badge className="bg-primary/15 text-primary border-transparent">
												{t("statusPublished")}
											</Badge>
										)}
										{c.publishedAt ? (
											<span className="text-xs text-muted-foreground">
												{fmt.date(c.publishedAt)}
											</span>
										) : null}
									</span>
								</Card>
							</Link>
						))}
						{list.data.items.length === 0 ? (
							<p className="text-muted-foreground text-sm">{t("noEntries")}</p>
						) : null}
					</div>
					<Pager
						page={list.data.page}
						total={list.data.total}
						pageSize={list.data.pageSize}
						onPageChange={setPage}
					/>
				</>
			)}
		</div>
	);
}
