import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/contexts/UserContext";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

const STATUSES = ["online", "away", "dnd", "invisible"] as const;
type ManualStatus = (typeof STATUSES)[number];

const DOT: Record<ManualStatus, string> = {
	online: "bg-emerald-500",
	away: "bg-amber-500",
	dnd: "bg-red-500",
	invisible: "bg-zinc-500",
};

export function UserStatusMenu({ children }: { children: React.ReactNode }) {
	const t = useTranslations("accountPages");
	const c = useTranslations("commonUi");
	const { logout } = useUser();
	const qc = useQueryClient();
	const mine = useQuery(orpc.presence.mine.queryOptions({ input: undefined }));
	const current = (mine.data?.manualStatus as ManualStatus) ?? "online";
	const [draft, setDraft] = useState("");
	useEffect(() => {
		setDraft(mine.data?.customStatus ?? "");
	}, [mine.data?.customStatus]);

	const save = useMutation({
		mutationFn: (patch: {
			manualStatus?: ManualStatus;
			customStatus?: string | null;
		}) =>
			client.presence.setStatus({
				manualStatus: patch.manualStatus ?? current,
				customStatus:
					patch.customStatus !== undefined
						? patch.customStatus
						: (mine.data?.customStatus ?? null),
			}),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: orpc.presence.mine.queryKey() }),
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<Popover>
			<PopoverTrigger asChild>{children}</PopoverTrigger>
			<PopoverContent side="top" align="start" className="w-64 p-1.5">
				<div className="px-1.5 pb-1 text-xs font-medium text-muted-foreground">
					{t("presenceLabel")}
				</div>
				{STATUSES.map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => save.mutate({ manualStatus: s })}
						className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
							current === s ? "bg-muted" : ""
						}`}
					>
						<span className={`size-2.5 rounded-full ${DOT[s]}`} />
						<span className="flex-1 text-left">{t(`status_${s}`)}</span>
						{current === s ? (
							<CheckIcon className="size-4 text-primary" />
						) : null}
					</button>
				))}
				<div className="my-1.5 border-t border-border" />
				<div className="flex items-center gap-1.5 px-0.5">
					<Input
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter")
								save.mutate({ customStatus: draft.trim() || null });
						}}
						placeholder={t("customStatusPlaceholder")}
						maxLength={140}
						className="h-8 text-sm"
					/>
					<button
						type="button"
						onClick={() => save.mutate({ customStatus: draft.trim() || null })}
						disabled={save.isPending}
						aria-label={t("savePresence")}
						className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
					>
						<CheckIcon className="size-4" />
					</button>
				</div>
				<div className="my-1.5 border-t border-border" />
				<Link
					to={"/account" as never}
					className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
				>
					<SettingsIcon className="size-4 text-muted-foreground" />
					{c("account")}
				</Link>
				<button
					type="button"
					onClick={() => void logout(true)}
					className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-muted"
				>
					<LogOutIcon className="size-4" />
					{c("logOut")}
				</button>
			</PopoverContent>
		</Popover>
	);
}
