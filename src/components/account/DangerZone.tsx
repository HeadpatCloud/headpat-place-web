import { useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";

type Props = {
	twoFactorEnabled: boolean;
	onDelete: (args: { password: string; totpCode?: string }) => Promise<void>;
};

export function DangerZone({ twoFactorEnabled, onDelete }: Props) {
	const t = useTranslations("accountPages");
	const c = useTranslations("common");
	const [password, setPassword] = useState("");
	const [totp, setTotp] = useState("");
	const [busy, setBusy] = useState(false);

	const canSubmit =
		password.length >= 1 && (!twoFactorEnabled || totp.length >= 6);

	async function handleDelete() {
		setBusy(true);
		try {
			await onDelete({
				password,
				totpCode: twoFactorEnabled ? totp : undefined,
			});
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-destructive/40 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h3 className="text-sm font-semibold">{t("deleteAccount")}</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					{t("deleteAccountDescription")}
				</p>
			</div>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" className="shrink-0">
						{t("deleteAccount")}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogTitle>{t("deleteAccountConfirmTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{twoFactorEnabled
							? t("deleteAccountConfirmWith2fa")
							: t("deleteAccountConfirmBody")}
					</AlertDialogDescription>
					<div className="space-y-3 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="del-password">{t("confirmPassword")}</Label>
							<Input
								id="del-password"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						{twoFactorEnabled ? (
							<div className="space-y-1.5">
								<Label htmlFor="del-totp">{t("twoFactorCode")}</Label>
								<Input
									id="del-totp"
									inputMode="numeric"
									autoComplete="one-time-code"
									maxLength={6}
									placeholder="123456"
									value={totp}
									onChange={(e) =>
										setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))
									}
								/>
							</div>
						) : null}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={busy}>{c("cancel")}</AlertDialogCancel>
						<Button
							variant="destructive"
							disabled={!canSubmit || busy}
							onClick={handleDelete}
						>
							{busy ? t("deleting") : t("deleteAccount")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
