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
import { client } from "@/lib/orpc";

const STATUSES = [
	{ value: "online", label: "Online" },
	{ value: "away", label: "Away" },
	{ value: "dnd", label: "Do not disturb" },
	{ value: "invisible", label: "Invisible" },
] as const;

export function PresenceSettings() {
	const [status, setStatus] =
		useState<(typeof STATUSES)[number]["value"]>("online");
	const [custom, setCustom] = useState("");
	const save = useMutation({
		mutationFn: () =>
			client.presence.setStatus({
				manualStatus: status,
				customStatus: custom.trim() || null,
			}),
		onSuccess: () => toast.success("Presence updated."),
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<div className="space-y-3">
			<div className="grid gap-2 sm:max-w-sm">
				<Label>Presence</Label>
				<Select
					value={status}
					onValueChange={(v) => setStatus(v as typeof status)}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{STATUSES.map((s) => (
							<SelectItem key={s.value} value={s.value}>
								{s.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid gap-2 sm:max-w-sm">
				<Label>Custom status</Label>
				<Input
					value={custom}
					onChange={(e) => setCustom(e.target.value)}
					placeholder="Optional message"
					maxLength={140}
				/>
			</div>
			<Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
				Save presence
			</Button>
		</div>
	);
}
