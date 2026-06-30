import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/settings/")({
	component: AdminSettings,
});

type WebhookKey =
	| "discord.webhook.reports"
	| "discord.webhook.users"
	| "discord.webhook.tickets";

function AdminSettings() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const qc = useQueryClient();
	const configQ = useQuery(
		orpc.adminConfig.get.queryOptions({ input: undefined }),
	);
	const [drafts, setDrafts] = useState<Record<string, string>>({});

	const save = useMutation({
		mutationFn: (vars: { key: WebhookKey; value: string }) =>
			client.adminConfig.set({ key: vars.key, value: vars.value || null }),
		onSuccess: () => {
			toast.success(t("saved"));
			qc.invalidateQueries({ queryKey: orpc.adminConfig.get.queryKey() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (configQ.isError)
		return <p className="text-muted-foreground">{t("noAccess")}</p>;
	if (configQ.isPending)
		return <p className="text-muted-foreground">{c("loading")}</p>;

	const fields: { key: WebhookKey; label: string }[] = [
		{ key: "discord.webhook.reports", label: t("webhookReports") },
		{ key: "discord.webhook.users", label: t("webhookUsers") },
		{ key: "discord.webhook.tickets", label: t("webhookTickets") },
	];
	const fieldValue = (key: string) =>
		drafts[key] ?? configQ.data.find((r) => r.key === key)?.value ?? "";

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-extrabold tracking-tight">
				{t("adminSettings")}
			</h1>
			<Card>
				<CardHeader>
					<CardTitle>{t("discordWebhooks")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						{t("discordWebhooksHint")}
					</p>
					{fields.map((f) => (
						<div key={f.key} className="space-y-1.5">
							<Label>{f.label}</Label>
							<div className="flex gap-2">
								<Input
									value={fieldValue(f.key)}
									onChange={(e) =>
										setDrafts((d) => ({ ...d, [f.key]: e.target.value }))
									}
									placeholder="https://discord.com/api/webhooks/…"
									autoComplete="off"
								/>
								<Button
									type="button"
									className="shrink-0"
									disabled={save.isPending}
									onClick={() =>
										save.mutate({ key: f.key, value: fieldValue(f.key).trim() })
									}
								>
									{c("save")}
								</Button>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
