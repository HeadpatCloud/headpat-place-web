import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useThemeController } from "@/components/contexts/ThemeController";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client, orpc } from "@/lib/orpc";
import { readActiveToken } from "@/lib/theme/color";
import { CONTRAST_MIN, contrastRatio } from "@/lib/theme/contrast";
import { themeCss } from "@/lib/theme/css";
import {
	CONTRAST_PAIRS,
	THEME_TOKEN_GROUPS,
	THEME_TOKEN_KEYS,
	type ThemeTokens,
} from "@/lib/theme/tokens";

const PREVIEW_STYLE_ID = "hp-preview";
const PREVIEW_SLUG = "preview";

function seedFromActive(): ThemeTokens {
	return Object.fromEntries(
		THEME_TOKEN_KEYS.map((k) => [k, readActiveToken(k)]),
	) as ThemeTokens;
}

export function ThemeBuilder({
	editId,
	onClose,
}: {
	editId: string | null;
	onClose: () => void;
}) {
	const { myThemes } = useThemeController();
	const qc = useQueryClient();
	const editing = editId ? myThemes.find((t) => t.id === editId) : null;

	const [name, setName] = useState(editing?.name ?? "My theme");
	const [light, setLight] = useState<ThemeTokens>(
		editing?.light ?? seedFromActive(),
	);
	const [dark, setDark] = useState<ThemeTokens>(
		editing?.dark ?? seedFromActive(),
	);
	const [tab, setTab] = useState<"light" | "dark">("dark");

	useEffect(() => {
		const css = themeCss(`[data-theme="${PREVIEW_SLUG}"]`, light, dark);
		let el = document.getElementById(
			PREVIEW_STYLE_ID,
		) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement("style");
			el.id = PREVIEW_STYLE_ID;
			document.head.appendChild(el);
		}
		el.textContent = css;
		const prev = document.documentElement.dataset.theme;
		document.documentElement.dataset.theme = PREVIEW_SLUG;
		return () => {
			document.getElementById(PREVIEW_STYLE_ID)?.remove();
			document.documentElement.dataset.theme = prev;
		};
	}, [light, dark]);

	const current = tab === "light" ? light : dark;
	const setCurrent = tab === "light" ? setLight : setDark;
	const update = (key: string, value: string) =>
		setCurrent((prev) => ({ ...prev, [key]: value }));

	const warnings = useMemo(
		() =>
			CONTRAST_PAIRS.filter(
				([bg, fg]) => contrastRatio(current[bg], current[fg]) < CONTRAST_MIN,
			).map(([bg, fg]) => `${bg} / ${fg}`),
		[current],
	);

	const save = useMutation({
		mutationFn: () =>
			editId
				? client.theme.update({ id: editId, name, light, dark })
				: client.theme.create({ name, light, dark }),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: orpc.theme.myThemes.queryKey({ input: {} }),
			});
			toast.success(editId ? "Theme updated" : "Theme created");
			onClose();
		},
		onError: (e: Error) => toast.error(e.message),
	});

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{editId ? "Edit theme" : "Create theme"}</DialogTitle>
				</DialogHeader>

				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					maxLength={60}
					placeholder="Theme name"
				/>

				<Tabs value={tab} onValueChange={(v) => setTab(v as "light" | "dark")}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="light">Light</TabsTrigger>
						<TabsTrigger value="dark">Dark</TabsTrigger>
					</TabsList>
					{(["light", "dark"] as const).map((m) => (
						<TabsContent key={m} value={m} className="space-y-4">
							{warnings.length > 0 ? (
								<p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
									⚠ Low contrast: {warnings.join(", ")}
								</p>
							) : null}
							{THEME_TOKEN_GROUPS.map((group) => (
								<div key={group.label}>
									<div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
										{group.label}
									</div>
									<div className="grid grid-cols-2 gap-2">
										{group.tokens.map((t) => (
											<label
												key={t.key}
												className="flex items-center gap-2 text-sm"
											>
												<input
													type="color"
													value={current[t.key]}
													onChange={(e) => update(t.key, e.target.value)}
													className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent"
												/>
												<span className="truncate">{t.label}</span>
											</label>
										))}
									</div>
								</div>
							))}
						</TabsContent>
					))}
				</Tabs>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => save.mutate()}
						disabled={save.isPending || !name.trim()}
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
