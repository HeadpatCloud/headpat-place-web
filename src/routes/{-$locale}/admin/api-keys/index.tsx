import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { Card } from "@/components/ui/card";
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

export const Route = createFileRoute("/{-$locale}/admin/api-keys/")({
	component: AdminApiKeys,
});

const EXPIRY_DAYS = [7, 30, 90, 365] as const;

type CreatedKey = Awaited<ReturnType<typeof client.adminApiKey.create>>;

function canGrant(myPerms: Set<string>, perm: string): boolean {
	if (myPerms.has("*:*") || myPerms.has(perm)) return true;
	return myPerms.has(`${perm.split(":")[0]}:*`);
}

function AdminApiKeys() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const qc = useQueryClient();

	const catalog = useQuery(
		orpc.adminApiKey.catalog.queryOptions({ input: undefined }),
	);
	const list = useQuery(
		orpc.adminApiKey.list.queryOptions({ input: undefined }),
	);
	const myPerms = useQuery(
		orpc.adminRole.myPermissions.queryOptions({ input: undefined }),
	);

	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [perms, setPerms] = useState<Set<string>>(new Set());
	const [expiry, setExpiry] = useState("never");
	const [created, setCreated] = useState<CreatedKey | null>(null);
	const [copied, setCopied] = useState(false);

	function resetForm() {
		setName("");
		setPerms(new Set());
		setExpiry("never");
		setCreated(null);
		setCopied(false);
	}

	const create = useMutation({
		mutationFn: () =>
			client.adminApiKey.create({
				name: name.trim(),
				permissions: [...perms],
				expiresInDays: expiry === "never" ? null : Number(expiry),
			}),
		onSuccess: (key) => {
			setCreated(key);
			qc.invalidateQueries({ queryKey: orpc.adminApiKey.list.queryKey() });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const revoke = useMutation({
		mutationFn: (id: string) => client.adminApiKey.revoke({ id }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: orpc.adminApiKey.list.queryKey() });
			toast.success(t("apiKeysRevoked"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function toggle(perm: string) {
		setPerms((prev) => {
			const next = new Set(prev);
			if (next.has(perm)) next.delete(perm);
			else next.add(perm);
			return next;
		});
	}

	function submit() {
		if (!name.trim()) return toast.error(t("apiKeysEnterName"));
		if (perms.size === 0) return toast.error(t("apiKeysSelectPermissions"));
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

	if (catalog.isError) {
		return (
			<p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
				{t("apiKeysNoAccess")}
			</p>
		);
	}

	const cat = catalog.data ?? {};
	const mine = new Set(myPerms.data ?? []);
	const keys = list.data ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-extrabold tracking-tight">
					{t("apiKeysTitle")}
				</h1>
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
										<Label htmlFor="adminkey-name">{t("name")}</Label>
										<Input
											id="adminkey-name"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder={t("apiKeysNamePlaceholder")}
											maxLength={80}
										/>
									</div>

									<div className="space-y-2">
										<Label>{t("apiKeysPermissions")}</Label>
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
															const perm = `${resource}:${action}`;
															const on = perms.has(perm);
															const allowed = canGrant(mine, perm);
															return (
																<button
																	key={perm}
																	type="button"
																	disabled={!allowed}
																	title={
																		allowed
																			? undefined
																			: t("apiKeysCannotGrant")
																	}
																	onClick={() => toggle(perm)}
																	className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
										<Label htmlFor="adminkey-expiry">
											{t("apiKeysExpiry")}
										</Label>
										<Select value={expiry} onValueChange={setExpiry}>
											<SelectTrigger id="adminkey-expiry">
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

			<p className="text-sm text-muted-foreground">{t("apiKeysDescription")}</p>

			{list.isPending ? (
				<p className="text-sm text-muted-foreground">{c("loading")}</p>
			) : keys.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
					{t("apiKeysEmpty")}
				</p>
			) : (
				<div className="space-y-2">
					{keys.map((k) => (
						<Card key={k.id} className="flex items-start gap-4 p-4">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
								<KeyRound className="size-5" />
							</div>
							<div className="min-w-0 flex-1 space-y-1.5">
								<div className="flex flex-wrap items-center gap-2">
									<span className="truncate text-sm font-medium">{k.name}</span>
									<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
										{k.prefix ?? ""}
										{k.start ?? ""}…
									</code>
									<span className="text-xs text-muted-foreground">
										{t("apiKeysOwner", {
											owner: k.ownerName ?? k.ownerEmail ?? k.ownerId,
										})}
									</span>
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
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
