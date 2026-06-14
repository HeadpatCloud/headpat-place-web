import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

const EXPIRY_DAYS = [7, 30, 90, 365] as const;

type CreatedKey = Awaited<ReturnType<typeof client.apiKey.create>>;

export function ApiKeysSection() {
	const t = useTranslations("accountPages");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const qc = useQueryClient();

	const list = useQuery(orpc.apiKey.list.queryOptions({ input: undefined }));
	const catalog = useQuery(
		orpc.apiKey.catalog.queryOptions({ input: undefined }),
	);

	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [scopes, setScopes] = useState<Set<string>>(new Set());
	const [expiry, setExpiry] = useState("never");
	const [created, setCreated] = useState<CreatedKey | null>(null);
	const [copied, setCopied] = useState(false);

	function resetForm() {
		setName("");
		setScopes(new Set());
		setExpiry("never");
		setCreated(null);
		setCopied(false);
	}

	const create = useMutation({
		mutationFn: () =>
			client.apiKey.create({
				name: name.trim(),
				scopes: [...scopes],
				expiresInDays: expiry === "never" ? null : Number(expiry),
			}),
		onSuccess: (key) => {
			setCreated(key);
			qc.invalidateQueries({ queryKey: orpc.apiKey.list.queryKey() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const revoke = useMutation({
		mutationFn: (id: string) => client.apiKey.revoke({ id }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: orpc.apiKey.list.queryKey() });
			toast.success(t("apiKeysRevoked"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function toggle(scope: string) {
		setScopes((prev) => {
			const next = new Set(prev);
			if (next.has(scope)) next.delete(scope);
			else next.add(scope);
			return next;
		});
	}

	function submit() {
		if (!name.trim()) return toast.error(t("apiKeysEnterName"));
		if (scopes.size === 0) return toast.error(t("apiKeysSelectScopes"));
		create.mutate();
	}

	async function copyKey() {
		if (!created) return;
		await navigator.clipboard.writeText(created.key).catch(() => {});
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	function onOpenChange(next: boolean) {
		setOpen(next);
		if (!next) resetForm();
	}

	const keys = list.data ?? [];
	const cat = catalog.data ?? {};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Dialog open={open} onOpenChange={onOpenChange}>
					<DialogTrigger asChild>
						<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
							<KeyRound className="size-4" />
							{t("apiKeysCreate")}
						</Button>
					</DialogTrigger>
					<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
						{created ? (
							<>
								<DialogHeader>
									<DialogTitle>{t("apiKeysCreatedTitle")}</DialogTitle>
									<DialogDescription>
										{t("apiKeysSecretWarning")}
									</DialogDescription>
								</DialogHeader>
								<div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
									<code className="min-w-0 flex-1 break-all font-mono text-sm">
										{created.key}
									</code>
									<Button
										size="icon"
										variant="outline"
										onClick={copyKey}
										title={t("apiKeysCopy")}
									>
										{copied ? (
											<Check className="size-4 text-primary" />
										) : (
											<Copy className="size-4" />
										)}
									</Button>
								</div>
								<DialogFooter>
									<Button onClick={() => onOpenChange(false)}>
										{t("apiKeysDone")}
									</Button>
								</DialogFooter>
							</>
						) : (
							<>
								<DialogHeader>
									<DialogTitle>{t("apiKeysCreate")}</DialogTitle>
									<DialogDescription>
										{t("apiKeysDescription")}
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-1.5">
										<Label htmlFor="apikey-name">{t("apiKeysName")}</Label>
										<Input
											id="apikey-name"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder={t("apiKeysNamePlaceholder")}
											maxLength={80}
										/>
									</div>

									<div className="space-y-2">
										<Label>{t("apiKeysScopes")}</Label>
										<div className="divide-y rounded-lg border">
											{Object.entries(cat).map(([resource, actions]) => (
												<div
													key={resource}
													className="grid grid-cols-[110px_1fr] items-center gap-3 px-3 py-2"
												>
													<span className="text-sm font-semibold capitalize">
														{resource}
													</span>
													<div className="flex flex-wrap gap-1.5">
														{(actions as string[]).map((action) => {
															const scope = `${resource}:${action}`;
															const on = scopes.has(scope);
															return (
																<button
																	key={scope}
																	type="button"
																	onClick={() => toggle(scope)}
																	className={`rounded-md border px-2 py-1 text-xs transition-colors ${
																		on
																			? "border-primary bg-primary/15 text-primary"
																			: "border-input text-muted-foreground hover:border-primary/50"
																	}`}
																>
																	{action}
																</button>
															);
														})}
													</div>
												</div>
											))}
										</div>
									</div>

									<div className="space-y-1.5">
										<Label htmlFor="apikey-expiry">{t("apiKeysExpiry")}</Label>
										<Select value={expiry} onValueChange={setExpiry}>
											<SelectTrigger id="apikey-expiry">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="never">
													{t("apiKeysExpiryNever")}
												</SelectItem>
												{EXPIRY_DAYS.map((d) => (
													<SelectItem key={d} value={String(d)}>
														{t("apiKeysExpiryDays", { count: d })}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<DialogFooter>
									<Button
										onClick={submit}
										disabled={create.isPending}
										className="bg-primary text-primary-foreground hover:bg-primary/90"
									>
										{create.isPending ? (
											<Loader2 className="size-4 animate-spin" />
										) : null}
										{t("apiKeysCreate")}
									</Button>
								</DialogFooter>
							</>
						)}
					</DialogContent>
				</Dialog>
			</div>

			{list.isPending ? (
				<p className="text-sm text-muted-foreground">{c("loading")}</p>
			) : keys.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
					{t("apiKeysEmpty")}
				</p>
			) : (
				<ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
					{keys.map((k) => (
						<li key={k.id} className="flex items-start gap-4 p-4">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
								<KeyRound className="size-5" />
							</div>
							<div className="min-w-0 flex-1 space-y-1.5">
								<div className="flex items-center gap-2">
									<span className="truncate text-sm font-medium">{k.name}</span>
									<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
										{k.prefix ?? ""}
										{k.start ?? ""}…
									</code>
								</div>
								<div className="flex flex-wrap gap-1">
									{Object.entries(k.permissions).flatMap(([res, acts]) =>
										(acts as string[]).map((a) => (
											<Badge
												key={`${res}:${a}`}
												variant="secondary"
												className="text-[10px]"
											>
												{res}:{a}
											</Badge>
										)),
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									{k.expiresAt
										? t("apiKeysExpiresAt", {
												date: fmt.dateTime(k.expiresAt),
											})
										: t("apiKeysNeverExpires")}
									{" · "}
									{k.lastRequest
										? t("apiKeysLastUsed", {
												date: fmt.dateTime(k.lastRequest),
											})
										: t("apiKeysNeverUsed")}
								</p>
							</div>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="outline" size="sm" className="shrink-0">
										{t("apiKeysRevoke")}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t("apiKeysRevokeConfirmTitle")}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t("apiKeysRevokeConfirmBody", { name: k.name ?? "" })}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => revoke.mutate(k.id)}
											disabled={revoke.isPending}
											className="bg-destructive text-white hover:bg-destructive/90"
										>
											{t("apiKeysRevoke")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
