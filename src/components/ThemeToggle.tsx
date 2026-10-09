import { Moon, SunDim } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "@/lib/i18n";
import { Button } from "./ui/button";

export const ThemeToggle = () => {
	const t = useTranslations("commonUi");
	const { setTheme } = useTheme();
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const changeTheme = async () => {
		if (!buttonRef.current) return;

		// Check if startViewTransition is supported
		if (typeof document.startViewTransition === "function") {
			await document.startViewTransition(() => {
				flushSync(() => {
					const dark = document.documentElement.classList.toggle("dark");
					setTheme(dark ? "dark" : "light");
				});
			}).ready;
		} else {
			// Fallback for browsers that don't support view transitions
			const dark = document.documentElement.classList.toggle("dark");
			setTheme(dark ? "dark" : "light");
			return;
		}

		const { top, left, width, height } =
			buttonRef.current.getBoundingClientRect();
		const y = top + height / 2;
		const x = left + width / 2;

		const right = window.innerWidth - left;
		const bottom = window.innerHeight - top;
		const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

		document.documentElement.animate(
			{
				clipPath: [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${maxRad}px at ${x}px ${y}px)`,
				],
			},
			{
				duration: 700,
				easing: "ease-in-out",
				pseudoElement: "::view-transition-new(root)",
			},
		);
	};
	return (
		<Button
			ref={buttonRef}
			onClick={changeTheme}
			variant={"ghost"}
			size={"icon"}
			aria-label={t("toggleTheme")}
		>
			<SunDim
				className="hidden size-5 dark:block"
				aria-description={t("lightMode")}
			/>
			<Moon
				className="block size-5 dark:hidden"
				aria-description={t("darkMode")}
			/>
		</Button>
	);
};
