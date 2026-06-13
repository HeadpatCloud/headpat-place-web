import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient, useSession } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n";

function QrImage({ value }: { value: string }) {
	const t = useTranslations("accountPages");
	const [src, setSrc] = useState<string | null>(null);
	useEffect(() => {
		let active = true;
		QRCode.toDataURL(value, { margin: 2, width: 220 })
			.then((d) => {
				if (active) setSrc(d);
			})
			.catch(() => setSrc(null));
		return () => {
			active = false;
		};
	}, [value]);
	if (!src) return null;
	return (
		<img
			src={src}
			alt={t("twoFactorQrAlt")}
			width={184}
			height={184}
			className="rounded-lg border border-border bg-white p-2"
		/>
	);
}

function BackupCodes({ codes }: { codes: string[] }) {
	const t = useTranslations("accountPages");
	return (
		<div className="rounded-lg border border-border bg-muted/40 p-3">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium">{t("backupCodes")}</p>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => {
						navigator.clipboard.writeText(codes.join("\n"));
						toast.success(t("backupCodesCopied"));
					}}
				>
					{t("copyAll")}
				</Button>
			</div>
			<p className="mt-1 text-xs text-muted-foreground">
				{t("backupCodesHint")}
			</p>
			<ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm">
				{codes.map((c) => (
					<li key={c}>{c}</li>
				))}
			</ul>
		</div>
	);
}

export function TwoFactorPanel() {
	const t = useTranslations("accountPages");
	const { data: session, refetch } = useSession();
	const enabled = session?.user?.twoFactorEnabled;

	const [password, setPassword] = useState("");
	const [setupUri, setSetupUri] = useState<string | null>(null);
	const [verifyCode, setVerifyCode] = useState("");
	const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
	const [busy, setBusy] = useState(false);

	const [regenPw, setRegenPw] = useState("");
	const [regenOpen, setRegenOpen] = useState(false);
	const [newCodes, setNewCodes] = useState<string[] | null>(null);

	async function startEnroll() {
		setBusy(true);
		const r = await authClient.twoFactor.enable({ password });
		setBusy(false);
		if (r.error) {
			toast.error(r.error.message ?? t("twoFactorStartFailed"));
			return;
		}
		setSetupUri(r.data?.totpURI ?? null);
		setBackupCodes(r.data?.backupCodes ?? null);
		setPassword("");
	}

	async function confirmEnroll() {
		setBusy(true);
		const r = await authClient.twoFactor.verifyTotp({ code: verifyCode });
		setBusy(false);
		if (r.error) {
			toast.error(r.error.message ?? t("invalidCode"));
			return;
		}
		toast.success(t("twoFactorEnabled"));
		setSetupUri(null);
		setVerifyCode("");
		setBackupCodes(null);
		await refetch();
	}

	async function disable() {
		setBusy(true);
		const r = await authClient.twoFactor.disable({ password });
		setBusy(false);
		if (r.error) {
			toast.error(r.error.message ?? t("twoFactorDisableFailed"));
			return;
		}
		toast.success(t("twoFactorDisabled"));
		setPassword("");
		await refetch();
	}

	async function regenerate() {
		setBusy(true);
		const r = await authClient.twoFactor.generateBackupCodes({
			password: regenPw,
		});
		setBusy(false);
		if (r.error) {
			toast.error(r.error.message ?? t("regenerateFailed"));
			return;
		}
		setNewCodes(r.data?.backupCodes ?? null);
		setRegenPw("");
		setRegenOpen(false);
		toast.success(t("backupCodesGenerated"));
	}

	if (setupUri) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">
					{t("twoFactorScanHint")}
				</p>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
					<QrImage value={setupUri} />
					<div className="space-y-3">
						<div className="space-y-2">
							<Label>{t("verificationCode")}</Label>
							<InputOTP
								maxLength={6}
								value={verifyCode}
								onChange={setVerifyCode}
							>
								<InputOTPGroup>
									{Array.from({ length: 6 }).map((_, i) => (
										<InputOTPSlot key={i} index={i} />
									))}
								</InputOTPGroup>
							</InputOTP>
						</div>
						<details className="text-sm text-muted-foreground">
							<summary className="cursor-pointer">{t("cantScan")}</summary>
							<code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-xs">
								{setupUri}
							</code>
						</details>
						<Button
							disabled={busy || verifyCode.length !== 6}
							onClick={confirmEnroll}
						>
							{t("confirmEnable")}
						</Button>
					</div>
				</div>
				{backupCodes && backupCodes.length > 0 ? (
					<BackupCodes codes={backupCodes} />
				) : null}
			</div>
		);
	}

	if (enabled) {
		return (
			<div className="space-y-4">
				<p className="text-sm">
					{t("twoFactorOnPrefix")}{" "}
					<span className="font-semibold text-primary">{t("twoFactorOn")}</span>
					{t("twoFactorOnSuffix")}
				</p>

				{newCodes ? <BackupCodes codes={newCodes} /> : null}

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setRegenOpen((v) => !v)}
					>
						{t("regenerateBackupCodes")}
					</Button>
				</div>
				{regenOpen ? (
					<div className="flex max-w-sm flex-col gap-2">
						<Label>{t("confirmPassword")}</Label>
						<Input
							type="password"
							value={regenPw}
							onChange={(e) => setRegenPw(e.target.value)}
						/>
						<Button
							size="sm"
							disabled={busy || regenPw.length < 8}
							onClick={regenerate}
						>
							{t("generateNewCodes")}
						</Button>
					</div>
				) : null}

				<div className="flex max-w-sm flex-col gap-2 border-t border-border pt-4">
					<Label>{t("disableTwoFactorLabel")}</Label>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<Button
						variant="destructive"
						size="sm"
						disabled={busy || password.length < 8}
						onClick={disable}
					>
						{t("disableTwoFactor")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex max-w-sm flex-col gap-2">
			<p className="text-sm text-muted-foreground">{t("twoFactorIntro")}</p>
			<Label>{t("confirmPassword")}</Label>
			<Input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>
			<Button disabled={busy || password.length < 8} onClick={startEnroll}>
				{t("enableTwoFactor")}
			</Button>
		</div>
	);
}
