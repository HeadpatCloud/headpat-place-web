import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import {
	LocalizedLink as Link,
	useLocalizedNavigate as useNavigate,
} from "@/lib/localized-nav";
import { Button } from "../ui/button";

export function HeaderSearch() {
	const t = useTranslations("commonUi");
	const navigate = useNavigate();
	const [q, setQ] = useState("");
	return (
		// The pill gets whatever the header has left, so measure that: when it is
		// too narrow to read (phones), show a round icon button instead.
		<div className="@container flex min-w-0 flex-1 justify-end">
			<Button
				asChild
				variant="ghost"
				size="icon"
				className="rounded-full @min-[11rem]:hidden"
			>
				<Link to="/search" aria-label={t("searchLabel")}>
					<SearchIcon className="size-5" />
				</Link>
			</Button>
			<form
				className="bg-background text-muted-foreground hidden @min-[11rem]:flex h-11 min-w-0 max-w-lg flex-1 items-center gap-2.5 rounded-full px-4"
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
		</div>
	);
}
