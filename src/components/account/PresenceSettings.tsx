import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
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
import { useTranslations } from "@/lib/i18n";
import { client } from "@/lib/orpc";

const STATUS_VALUES = ["online", "away", "dnd", "invisible"] as const;

export function PresenceSettings() {
	const t = useTranslations("accountPages");
	const [status, setStatus] =
		useState<(typeof STATUS_VALUES)[number]>("online");
	const [custom, setCustom] = useState("");
	const save = useMutation({
		mutationFn: () =>
			client.presence.setStatus({
				manualStatus: status,
				customStatus: custom.trim() || null,
			}),
		onSuccess: () => toast.success(t("presenceUpdated")),
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<div className="space-y-3">
			<div className="grid gap-2 sm:max-w-sm">
				<Label>{t("presenceLabel")}</Label>
				<Select
					value={status}
					onValueChange={(v) => setStatus(v as typeof status)}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{STATUS_VALUES.map((value) => (
							<SelectItem key={value} value={value}>
								{t(`status_${value}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2 sm:max-w-sm">
				<Label>{t("customStatus")}</Label>
				<Input
					value={custom}
					onChange={(e) => setCustom(e.target.value)}
					placeholder={t("customStatusPlaceholder")}
					maxLength={140}
				/>
			</div>
			<Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
				{t("savePresence")}
			</Button>
		</div>
	);
}
