import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";

export function HeaderSearch() {
	const t = useTranslations("commonUi");
	const navigate = useNavigate();
	const [q, setQ] = useState("");
	return (
		<form
			className="bg-background text-muted-foreground flex h-11 min-w-0 max-w-lg flex-1 items-center gap-2.5 rounded-full px-4"
			onSubmit={(e) => {
				e.preventDefault();
				const query = q.trim();
				navigate({
					to: "/search",
					search: query ? { q: query } : {},
				} as never);
			}}
		>
			<SearchIcon className="size-4.5 shrink-0" aria-hidden />
			<input
				type="search"
				value={q}
				onChange={(e) => setQ(e.target.value)}
				placeholder={t("searchPlaceholder")}
				aria-label={t("searchLabel")}
				className="text-foreground min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
			/>
		</form>
	);
}
