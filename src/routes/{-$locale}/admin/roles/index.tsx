import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/AdminPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin/roles/")({
	component: RolesList,
});

function RolesList() {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const navigate = useNavigate();
	const roles = useQuery(orpc.adminRole.list.queryOptions({ input: {} }));
	const [name, setName] = useState("");

	const create = useMutation({
		mutationFn: () => client.adminRole.create({ name: name.trim() }),
		onSuccess: (r) => {
			setName("");
			qc.invalidateQueries({
				queryKey: orpc.adminRole.list.queryKey({ input: {} }),
			});
			navigate({ to: `/admin/roles/${r.id}` as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function submit() {
		if (!name.trim()) {
			toast.error(t("enterRoleName"));
			return;
		}
		create.mutate();
	}

	return (
		<AdminPage title={t("roles")}>
			<div className="flex gap-3">
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && submit()}
					placeholder={t("newRoleName")}
					className="h-11"
				/>
				<Button
					disabled={create.isPending}
					onClick={submit}
					size="lg"
					className="shrink-0"
				>
					{t("newRole")}
				</Button>
			</div>
			<ul className="grid gap-3">
				{(roles.data ?? []).map((r) => (
					<li key={r.id}>
						<Link
							to={`/admin/roles/${r.id}` as never}
							className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:bg-muted/40"
						>
							<span className="flex items-center gap-3">
								<span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-link">
									<ShieldIcon className="size-5" />
								</span>
								<span className="font-display text-lg font-semibold">
									{r.name}
								</span>
								{r.isSystem ? (
									<Badge variant="outline">{t("systemBadge")}</Badge>
								) : null}
							</span>
							<span className="text-sm font-semibold text-muted-foreground">
								{t("permissionsMembersCount", {
									permissions: r.permissionCount,
									members: r.memberCount,
								})}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</AdminPage>
	);
}
