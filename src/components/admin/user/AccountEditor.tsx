import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AtSignIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useStepUp } from "@/components/admin/StepUp";
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
import { Switch } from "@/components/ui/switch";
import { isStepUpCancelled } from "@/lib/admin-access";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

type AdminUser = Awaited<ReturnType<typeof client.adminUser.get>>;

/** Account name and email. Sensitive: asks for a fresh authenticator code. */
export function AccountEditor({ u }: { u: AdminUser }) {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const { withStepUp } = useStepUp();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(u.name);
	const [email, setEmail] = useState(u.email ?? "");
	const [verified, setVerified] = useState(u.emailVerified);
	const [reason, setReason] = useState("");

	const save = useMutation({
		mutationFn: () =>
			withStepUp(() =>
				client.adminUser.updateAccount({
					userId: u.userId,
					...(name.trim() !== u.name ? { name: name.trim() } : {}),
					...(email.trim() && email.trim() !== u.email
						? { email: email.trim() }
						: {}),
					...(verified !== u.emailVerified ? { emailVerified: verified } : {}),
					reason: reason.trim(),
				}),
			),
		onSuccess: (r) => {
			toast.success(
				r.changed.length
					? t("profileSaved", { count: r.changed.length })
					: t("nothingChanged"),
			);
			qc.invalidateQueries({
				queryKey: orpc.adminUser.get.queryKey({ input: { userId: u.userId } }),
			});
			setOpen(false);
		},
		onError: (e: Error) => {
			if (!isStepUpCancelled(e)) toast.error(e.message);
		},
	});

	function submit(e: FormEvent) {
		e.preventDefault();
		save.mutate();
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (o) {
					setName(u.name);
					setEmail(u.email ?? "");
					setVerified(u.emailVerified);
					setReason("");
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<AtSignIcon className="size-4" />
					{t("editAccount")}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={submit} className="space-y-4">
					<DialogHeader>
						<DialogTitle>{t("editAccount")}</DialogTitle>
						<DialogDescription>{t("editAccountHint")}</DialogDescription>
					</DialogHeader>
					<div className="space-y-1.5">
						<Label htmlFor="acct-name">{t("accountName")}</Label>
						<Input
							id="acct-name"
							value={name}
							maxLength={120}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="acct-email">{t("email")}</Label>
						<Input
							id="acct-email"
							type="email"
							autoComplete="off"
							value={email}
							maxLength={254}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
						<Label htmlFor="sw-emailVerifiedSwitch">
							{t("emailVerifiedSwitch")}
						</Label>
						<Switch
							id="sw-emailVerifiedSwitch"
							checked={verified}
							onCheckedChange={setVerified}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="acct-reason">{t("reasonLabel")}</Label>
						<Input
							id="acct-reason"
							value={reason}
							maxLength={500}
							onChange={(e) => setReason(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">{t("reasonHint")}</p>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							type="submit"
							disabled={save.isPending || !reason.trim() || !name.trim()}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{t("save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
