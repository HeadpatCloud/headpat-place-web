import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Account = {
	id: string;
	providerId: string;
	accountId: string;
};

const SOCIALS = [
	{ id: "discord", label: "Discord" },
	{ id: "google", label: "Google" },
	{ id: "github", label: "GitHub" },
	{ id: "twitch", label: "Twitch" },
] as const;

function ProviderGlyph({ id, label }: { id: string; label: string }) {
	if (id === "github") {
		return <Github className="size-5" />;
	}
	if (id === "credential") {
		return <KeyRound className="size-5" />;
	}
	return <span className="text-sm font-bold">{label.charAt(0)}</span>;
}

export function ConnectedAccounts() {
	const qc = useQueryClient();
	const accounts = useQuery({
		queryKey: ["account", "linked"],
		queryFn: async () => {
			const r = await authClient.listAccounts();
			if (r.error)
				throw new Error(r.error.message ?? "Failed to load accounts");
			return (r.data ?? []) as Account[];
		},
	});

	const unlink = useMutation({
		mutationFn: async (a: Account) => {
			const r = await authClient.unlinkAccount({
				providerId: a.providerId,
				accountId: a.accountId,
			});
			if (r.error) throw new Error(r.error.message ?? "Failed to unlink");
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["account", "linked"] });
			toast.success("Account disconnected.");
		},
		onError: (e: Error) => toast.error(e.message),
	});

	async function connect(provider: string) {
		const r = await authClient.linkSocial({
			provider: provider as Parameters<
				typeof authClient.linkSocial
			>[0]["provider"],
			callbackURL: window.location.href,
		});
		if (r.error) toast.error(r.error.message ?? `Couldn't connect ${provider}`);
	}

	if (accounts.isPending) {
		return (
			<div className="flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
				<Loader2 className="size-4 animate-spin" /> Loading connections…
			</div>
		);
	}

	const list = accounts.data ?? [];
	const credential = list.find((a) => a.providerId === "credential");
	const total = list.length;

	function Row({
		glyphId,
		label,
		children,
	}: {
		glyphId: string;
		label: string;
		children: React.ReactNode;
	}) {
		return (
			<li className="flex items-center gap-4 p-4">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
					<ProviderGlyph id={glyphId} label={label} />
				</div>
				<span className="flex-1 text-sm font-medium">{label}</span>
				{children}
			</li>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<ul className="divide-y divide-border">
				{credential ? (
					<Row glyphId="credential" label="Email & password">
						<Badge className="bg-primary/15 text-primary hover:bg-primary/15">
							Active
						</Badge>
					</Row>
				) : null}
				{SOCIALS.map((p) => {
					const linked = list.find((a) => a.providerId === p.id);
					return (
						<Row key={p.id} glyphId={p.id} label={p.label}>
							{linked ? (
								<Button
									variant="outline"
									size="sm"
									disabled={unlink.isPending || total <= 1}
									title={
										total <= 1
											? "You can't remove your only sign-in method"
											: undefined
									}
									onClick={() => unlink.mutate(linked)}
								>
									Disconnect
								</Button>
							) : (
								<Button
									variant="outline"
									size="sm"
									onClick={() => connect(p.id)}
								>
									Connect
								</Button>
							)}
						</Row>
					);
				})}
			</ul>
		</div>
	);
}
