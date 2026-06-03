import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { client, orpc } from "@/lib/orpc";
import { themeCss } from "@/lib/theme/css";
import type { ThemeTokens } from "@/lib/theme/tokens";

const STORAGE_KEY = "hp-active-theme";
const CUSTOM_STYLE_ID = "hp-active-custom";

type UserTheme = {
	id: string;
	name: string;
	light: ThemeTokens;
	dark: ThemeTokens;
};

type Ctx = {
	activeTheme: string;
	setActiveTheme: (theme: string) => void;
	myThemes: UserTheme[];
};
const ThemeContext = createContext<Ctx>({
	activeTheme: "headpat",
	setActiveTheme: () => {},
	myThemes: [],
});
export function useThemeController() {
	return useContext(ThemeContext);
}

function resolvedSlug(active: string): string {
	return active.startsWith("custom:") ? `custom-${active.slice(7)}` : active;
}

function applyActive(active: string, themes: UserTheme[]) {
	if (typeof document === "undefined") return;
	document.documentElement.dataset.theme = resolvedSlug(active);
	const existing = document.getElementById(CUSTOM_STYLE_ID);
	if (active.startsWith("custom:")) {
		const id = active.slice(7);
		const t = themes.find((x) => x.id === id);
		// Theme not loaded yet (e.g. myThemes still fetching on reload) — leave the
		// pre-painted anti-flash <style> and the mirror intact instead of wiping
		// them, so the custom theme doesn't flicker to defaults before the query
		// resolves. The effect re-runs once myThemes loads and injects the real CSS.
		if (t) {
			const css = themeCss(`[data-theme="custom-${id}"]`, t.light, t.dark);
			const el =
				(existing as HTMLStyleElement) ?? document.createElement("style");
			el.id = CUSTOM_STYLE_ID;
			el.textContent = css;
			if (!existing) document.head.appendChild(el);
			localStorage.setItem(`${STORAGE_KEY}-css`, css);
		}
	} else {
		existing?.remove();
		localStorage.removeItem(`${STORAGE_KEY}-css`);
	}
	localStorage.setItem(STORAGE_KEY, active);
}

export function ThemeController({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const signedIn = !!session?.user;
	const qc = useQueryClient();

	const profile = useQuery({
		...orpc.profile.me.queryOptions({ input: undefined }),
		enabled: signedIn,
	});
	const themesQ = useQuery({
		...orpc.theme.myThemes.queryOptions({ input: {} }),
		enabled: signedIn,
	});

	const serverActive = (profile.data as { activeTheme?: string } | undefined)
		?.activeTheme;
	const myThemes = (themesQ.data ?? []) as UserTheme[];

	const active =
		(signedIn ? serverActive : null) ??
		(typeof localStorage !== "undefined"
			? localStorage.getItem(STORAGE_KEY)
			: null) ??
		"headpat";

	useEffect(() => {
		applyActive(active, myThemes);
	}, [active, myThemes]);

	const setMut = useMutation({
		mutationFn: (theme: string) => client.theme.setActive({ theme }),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: orpc.profile.me.queryKey() }),
	});

	const setActiveTheme = (theme: string) => {
		applyActive(theme, myThemes);
		if (signedIn) setMut.mutate(theme);
	};

	return (
		<ThemeContext.Provider
			value={{ activeTheme: active, setActiveTheme, myThemes }}
		>
			{children}
		</ThemeContext.Provider>
	);
}
