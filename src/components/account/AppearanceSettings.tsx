import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import { useThemeController } from "@/components/contexts/ThemeController";
import { ThemeBuilder } from "@/components/theme/ThemeBuilder";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";
import { PRESETS } from "@/lib/theme/presets";
import { cn } from "@/lib/utils";

const MODE_VALUES = ["system", "light", "dark"] as const;

function Swatch({ slug, dark }: { slug: string; dark: boolean }) {
	return (
		<div
			data-theme={slug}
			className={cn(
				"flex h-12 w-full overflow-hidden rounded-md border border-border",
				dark && "dark",
			)}
		>
			<div className="flex-1 bg-background" />
			<div className="flex-1 bg-card" />
			<div className="flex-1 bg-primary" />
			<div className="flex-1 bg-accent" />
		</div>
	);
}

export function AppearanceSettings() {
	const t = useTranslations("accountPages");
	const c = useTranslations("common");
	const { theme: mode, setTheme: setMode, resolvedTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const { activeTheme, setActiveTheme, myThemes } = useThemeController();
	const qc = useQueryClient();
	const [builder, setBuilder] = useState<
		{ mode: "create" } | { mode: "edit"; id: string } | null
	>(null);

	const del = useMutation({
		mutationFn: (id: string) => client.theme.delete({ id }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: orpc.theme.myThemes.queryKey({ input: {} }),
			});
			qc.invalidateQueries({ queryKey: orpc.profile.me.queryKey() });
			toast.success(t("themeDeleted"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<div className="mx-auto max-w-4xl space-y-10 p-6">
			<section>
				<h4 className="text-base font-semibold">{t("modeHeading")}</h4>
				<p className="mt-1 text-sm text-muted-foreground">
					{t("modeDescription")}
				</p>
				<div className="mt-3 inline-flex rounded-lg border border-border p-1">
					{MODE_VALUES.map((value) => (
						<button
							key={value}
							type="button"
							onClick={() => setMode(value)}
							className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
								mode === value
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{t(`mode_${value}`)}
						</button>
					))}
				</div>
			</section>

			<section>
				<h4 className="text-base font-semibold">{t("themeHeading")}</h4>
				<p className="mt-1 text-sm text-muted-foreground">
					{t("themeDescription")}
				</p>
				<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{PRESETS.map((p) => (
						<button
							key={p.slug}
							type="button"
							onClick={() => setActiveTheme(p.slug)}
							className={`rounded-lg border p-2 text-left transition-colors ${
								activeTheme === p.slug
									? "border-primary ring-2 ring-primary/40"
									: "border-border hover:border-foreground/30"
							}`}
						>
							<Swatch slug={p.slug} dark={dark} />
							<span className="mt-2 block text-sm font-medium">{p.name}</span>
						</button>
					))}
					{myThemes.map((theme) => {
						const value = `custom:${theme.id}`;
						return (
							<div
								key={theme.id}
								className={`rounded-lg border p-2 ${
									activeTheme === value
										? "border-primary ring-2 ring-primary/40"
										: "border-border"
								}`}
							>
								<button
									type="button"
									onClick={() => setActiveTheme(value)}
									className="block w-full text-left"
								>
									<div className="flex h-12 w-full overflow-hidden rounded-md border border-border">
										<div
											className="flex-1"
											style={{
												background: theme[dark ? "dark" : "light"].background,
											}}
										/>
										<div
											className="flex-1"
											style={{
												background: theme[dark ? "dark" : "light"].card,
											}}
										/>
										<div
											className="flex-1"
											style={{
												background: theme[dark ? "dark" : "light"].primary,
											}}
										/>
										<div
											className="flex-1"
											style={{
												background: theme[dark ? "dark" : "light"].accent,
											}}
										/>
									</div>
									<span className="mt-2 block truncate text-sm font-medium">
										{theme.name}
									</span>
								</button>
								<div className="mt-1 flex gap-2">
									<button
										type="button"
										onClick={() => setBuilder({ mode: "edit", id: theme.id })}
										className="text-xs text-muted-foreground underline hover:text-foreground"
									>
										{t("editTheme")}
									</button>
									<button
										type="button"
										onClick={() => del.mutate(theme.id)}
										className="text-xs text-destructive underline"
									>
										{c("delete")}
									</button>
								</div>
							</div>
						);
					})}
					<button
						type="button"
						onClick={() => setBuilder({ mode: "create" })}
						className="flex min-h-[5.5rem] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
					>
						{t("createTheme")}
					</button>
				</div>
			</section>

			{builder ? (
				<ThemeBuilder
					editId={builder.mode === "edit" ? builder.id : null}
					onClose={() => setBuilder(null)}
				/>
			) : null}
		</div>
	);
}
