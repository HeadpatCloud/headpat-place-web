import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";

export const Route = createFileRoute("/{-$locale}/_auth")({
	component: AuthLayout,
});

function AuthLayout() {
	const t = useTranslations("nav");
	return (
		<div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/20 via-transparent to-primary/15"
			/>
			<Link
				to="/"
				className="text-muted-foreground hover:text-foreground absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeft className="size-4" />
				{t("backToHeadpat")}
			</Link>
			<div className="absolute right-4 top-4 z-10 flex items-center gap-1">
				<LanguageSwitcher />
				<ThemeToggle />
			</div>
			<main className="relative z-10 w-full max-w-md">
				<Outlet />
			</main>
		</div>
	);
}
