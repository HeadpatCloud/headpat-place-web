import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ShieldAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import HeaderClient from "@/components/sidebar/header-client";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/admin")({
	component: AdminLayout,
});

function NotAuthorized() {
	const t = useTranslations("adminPanel");
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
			<div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
				<ShieldAlertIcon className="size-8" />
			</div>
			<h1 className="mt-5 text-2xl font-extrabold tracking-tight">
				{t("notAuthorizedTitle")}
			</h1>
			<p className="mt-2 max-w-sm text-muted-foreground">
				{t("notAuthorizedBody")}
			</p>
			<div className="mt-6 flex gap-2">
				<Button
					asChild
					className="bg-primary text-primary-foreground hover:bg-primary/90"
				>
					<Link to={"/login" as never}>{t("logIn")}</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to={"/" as never}>{t("backToSafety")}</Link>
				</Button>
			</div>
		</div>
	);
}

function AdminLayout() {
	const t = useTranslations("adminPanel");
	const navigate = useNavigate();
	const perms = useQuery({
		...orpc.adminRole.myPermissions.queryOptions({ input: undefined }),
		staleTime: 5 * 60_000,
	});

	useEffect(() => {
		if (perms.isSuccess && perms.data.length === 0) {
			navigate({ to: "/" as never, replace: true });
		}
	}, [perms.isSuccess, perms.data, navigate]);

	if (perms.isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">{t("checkingClearance")}</p>
			</div>
		);
	}
	if (!perms.data || perms.data.length === 0) return <NotAuthorized />;

	return (
		<HeaderClient
			sidebar={<AppSidebar mode="admin" />}
			containerClassName="mx-auto w-full max-w-screen-2xl px-4 py-6"
		>
			<Outlet />
		</HeaderClient>
	);
}
