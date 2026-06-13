import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
		<div className="space-y-4">
			<h1 className="text-2xl font-extrabold tracking-tight">{t("roles")}</h1>
			<div className="flex gap-2">
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && submit()}
					placeholder={t("newRoleName")}
				/>
				<Button
					disabled={create.isPending}
					onClick={submit}
					className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
				>
					{t("newRole")}
				</Button>
			</div>
			<div className="space-y-2">
				{(roles.data ?? []).map((r) => (
					<Link key={r.id} to={`/admin/roles/${r.id}` as never}>
						<Card className="card-hover flex items-center justify-between p-3">
							<span className="font-semibold">
								{r.name}
								{r.isSystem ? (
									<span className="ml-2 rounded-md border border-primary px-1.5 py-0.5 text-[10px] text-primary">
										{t("systemBadge")}
									</span>
								) : null}
							</span>
							<span className="text-xs text-muted-foreground">
								{t("permissionsMembersCount", {
									permissions: r.permissionCount,
									members: r.memberCount,
								})}
							</span>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
