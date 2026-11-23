import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { AdminPage, Empty, Panel } from "@/components/admin/AdminPage";
import { ConfirmDelete } from "@/components/admin/ConfirmDelete";
import { TableCard, Td, Th, Tr } from "@/components/admin/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/flags/")({
	component: FlagsPage,
});

const AUDIENCES = ["public", "earlyaccess", "staff", "dev"] as const;
type Audience = (typeof AUDIENCES)[number];

function FlagsPage() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const qc = useQueryClient();
	const flags = useQuery(
		orpc.featureFlag.list.queryOptions({ input: undefined }),
	);
	const [key, setKey] = useState("");
	const [audience, setAudience] = useState<Audience>("staff");
	const refresh = () =>
		qc.invalidateQueries({ queryKey: orpc.featureFlag.list.key() });
	const upsert = useMutation({
		mutationFn: (v: { key: string; audience: Audience; isEnabled: boolean }) =>
			client.featureFlag.upsert(v),
		onSuccess: refresh,
		onError: (e: Error) => toast.error(e.message),
	});
	const remove = useMutation({
		mutationFn: (v: { key: string; reason: string }) =>
			client.featureFlag.delete(v),
		onSuccess: () => {
			toast.success(t("deletedToast"));
			refresh();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function create(e: FormEvent) {
		e.preventDefault();
		upsert.mutate(
			{ key: key.trim(), audience, isEnabled: false },
			{ onSuccess: () => setKey("") },
		);
	}

	const rows = [...(flags.data ?? [])].sort((a, b) =>
		a.key.localeCompare(b.key),
	);

	return (
		<AdminPage title={t("flagsTitle")} description={t("flagsSubtitle")}>
			<Panel title={t("flagsNew")}>
				<form onSubmit={create} className="flex flex-wrap items-end gap-3">
					<div className="min-w-48 flex-1 space-y-1.5">
						<Label htmlFor="flag-key">{t("flagKey")}</Label>
						<Input
							id="flag-key"
							value={key}
							maxLength={120}
							placeholder="new-chat-layout"
							onChange={(e) => setKey(e.target.value.toLowerCase())}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>{t("flagAudience")}</Label>
						<Select
							value={audience}
							onValueChange={(v) => setAudience(v as Audience)}
						>
							<SelectTrigger className="w-44">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{AUDIENCES.map((a) => (
									<SelectItem key={a} value={a}>
										{t(`flagAudience_${a}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button
						type="submit"
						disabled={upsert.isPending || !key.trim()}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						{t("add")}
					</Button>
				</form>
				<p className="mt-2 text-xs text-muted-foreground">
					{t("flagsNewHint")}
				</p>
			</Panel>

			{flags.isError ? (
				<Empty>{t("noAccess")}</Empty>
			) : flags.isPending ? (
				<Empty>{c("loading")}</Empty>
			) : rows.length === 0 ? (
				<Empty>{t("flagsEmpty")}</Empty>
			) : (
				<TableCard>
					<thead>
						<tr>
							<Th>{t("flagKey")}</Th>
							<Th>{t("flagAudience")}</Th>
							<Th>{t("flagEnabled")}</Th>
							<Th>{t("updated")}</Th>
							<Th />
						</tr>
					</thead>
					<tbody>
						{rows.map((f) => (
							<Tr key={f.key}>
								<Td className="font-mono text-xs font-semibold">{f.key}</Td>
								<Td>
									<Select
										value={f.audience}
										onValueChange={(v) =>
											upsert.mutate({
												key: f.key,
												audience: v as Audience,
												isEnabled: f.isEnabled,
											})
										}
									>
										<SelectTrigger
											className="h-8 w-40"
											aria-label={t("flagAudience")}
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{AUDIENCES.map((a) => (
												<SelectItem key={a} value={a}>
													{t(`flagAudience_${a}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Td>
								<Td>
									<Switch
										checked={f.isEnabled}
										aria-label={t("flagEnabled")}
										onCheckedChange={(on) =>
											upsert.mutate({
												key: f.key,
												audience: f.audience as Audience,
												isEnabled: on,
											})
										}
									/>
								</Td>
								<Td className="whitespace-nowrap text-muted-foreground">
									{fmt.dateTime(f.updatedAt)}
								</Td>
								<Td className="text-right">
									<ConfirmDelete
										name={f.key}
										onConfirm={(reason) =>
											remove.mutate({ key: f.key, reason })
										}
									/>
								</Td>
							</Tr>
						))}
					</tbody>
				</TableCard>
			)}
		</AdminPage>
	);
}
