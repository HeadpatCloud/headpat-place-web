import { useQueryClient } from "@tanstack/react-query";
import { LockIcon, LockOpenIcon, ShieldCheckIcon } from "lucide-react";
import {
	createContext,
	type FormEvent,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	adminAccessQuery,
	errorCode,
	StepUpCancelled,
	useAdminAccess,
} from "@/lib/admin-access";
import { useTranslations } from "@/lib/i18n";
import { client } from "@/lib/orpc";

type Pending = { resolve: () => void; reject: (e: unknown) => void };

type StepUpApi = {
	/**
	 * Run a sensitive call. If the API asks for a fresh code, show the code
	 * dialog, then retry once it's accepted. Rejects with StepUpCancelled when
	 * the dialog is dismissed.
	 */
	withStepUp: <T>(fn: () => Promise<T>) => Promise<T>;
};

const StepUpContext = createContext<StepUpApi | null>(null);

export function useStepUp(): StepUpApi {
	const ctx = useContext(StepUpContext);
	if (!ctx) throw new Error("useStepUp must be used inside StepUpProvider");
	return ctx;
}

export function StepUpProvider({ children }: { children: ReactNode }) {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const pending = useRef<Pending | null>(null);
	const [open, setOpen] = useState(false);
	const [method, setMethod] = useState<"totp" | "backup">("totp");
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const askForCode = useCallback(
		() =>
			new Promise<void>((resolve, reject) => {
				pending.current = { resolve, reject };
				setCode("");
				setError(null);
				setMethod("totp");
				setOpen(true);
			}),
		[],
	);

	const withStepUp = useCallback(
		async <T,>(fn: () => Promise<T>): Promise<T> => {
			try {
				return await fn();
			} catch (e) {
				if (errorCode(e) !== "STEP_UP_REQUIRED") throw e;
				await askForCode();
				return await fn();
			}
		},
		[askForCode],
	);

	function close(cancelled: boolean) {
		setOpen(false);
		const p = pending.current;
		pending.current = null;
		if (cancelled) p?.reject(new StepUpCancelled());
	}

	async function submit(e: FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const r = await client.adminAuth.elevate({ method, code: code.trim() });
			if (r.ok) {
				await qc.invalidateQueries({ queryKey: adminAccessQuery().queryKey });
				const p = pending.current;
				pending.current = null;
				setOpen(false);
				p?.resolve();
			} else if (r.reason === "locked") {
				setError(t("stepUpLocked"));
			} else {
				setError(t("stepUpInvalid", { count: r.attemptsLeft }));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<StepUpContext.Provider value={{ withStepUp }}>
			{children}
			<Dialog open={open} onOpenChange={(o) => (o ? null : close(true))}>
				<DialogContent>
					<form onSubmit={submit} className="space-y-4">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<ShieldCheckIcon className="size-5 text-primary" />
								{t("stepUpTitle")}
							</DialogTitle>
							<DialogDescription>{t("stepUpBody")}</DialogDescription>
						</DialogHeader>
						<div className="space-y-2">
							<Label htmlFor="step-up-code">
								{method === "totp"
									? t("stepUpCodeLabel")
									: t("stepUpBackupLabel")}
							</Label>
							<Input
								id="step-up-code"
								autoFocus
								autoComplete="one-time-code"
								inputMode={method === "totp" ? "numeric" : "text"}
								value={code}
								onChange={(e) => setCode(e.target.value)}
								placeholder={method === "totp" ? "123456" : "xxxxx-xxxxx"}
							/>
							{error ? (
								<p className="text-sm text-destructive">{error}</p>
							) : null}
							<button
								type="button"
								className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
								onClick={() => {
									setMethod(method === "totp" ? "backup" : "totp");
									setCode("");
									setError(null);
								}}
							>
								{method === "totp" ? t("stepUpUseBackup") : t("stepUpUseTotp")}
							</button>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => close(true)}
							>
								{t("cancel")}
							</Button>
							<Button
								type="submit"
								disabled={busy || code.trim().length < 6}
								className="bg-primary text-primary-foreground hover:bg-primary/90"
							>
								{t("stepUpConfirm")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</StepUpContext.Provider>
	);
}

function minutesLeft(until: Date | string | null | undefined, now: number) {
	if (!until) return 0;
	const ms = new Date(until).getTime() - now;
	return ms > 0 ? Math.ceil(ms / 60_000) : 0;
}

/** Small header pill: shows how long sensitive actions stay unlocked. */
export function StepUpStatus() {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const access = useAdminAccess();
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 15_000);
		return () => clearInterval(id);
	}, []);
	const left = minutesLeft(access.data?.elevatedUntil, now);
	if (left === 0) {
		return (
			<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
				<LockIcon className="size-3.5" />
				{t("stepUpLockedState")}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-2 text-xs">
			<span className="inline-flex items-center gap-1.5 text-link">
				<LockOpenIcon className="size-3.5" />
				{t("stepUpUnlocked", { count: left })}
			</span>
			<Button
				variant="ghost"
				size="sm"
				className="h-6 px-2 text-xs"
				onClick={async () => {
					try {
						await client.adminAuth.lock();
						await qc.invalidateQueries({
							queryKey: adminAccessQuery().queryKey,
						});
					} catch (e) {
						toast.error(e instanceof Error ? e.message : String(e));
					}
				}}
			>
				{t("stepUpLockNow")}
			</Button>
		</span>
	);
}
