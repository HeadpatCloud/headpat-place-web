import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/")({
	component: AdminOverview,
});

function AdminOverview() {
	const t = useTranslations("adminPanel");
	const roles = useQuery(orpc.adminRole.list.queryOptions({ input: {} }));
	const roleCount = roles.data?.length ?? 0;
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-extrabold tracking-tight">
				{t("overview")}
			</h1>
			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="pt-6">
						<p className="text-3xl font-extrabold text-primary">{roleCount}</p>
						<p className="text-sm text-muted-foreground">{t("roles")}</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
