import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

type Props = {
	page: number;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
};

/** Numbered page control with prev/next + a windowed set of page numbers. */
export function Pager({ page, total, pageSize, onPageChange }: Props) {
	const t = useTranslations("commonUi");
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	if (pageCount <= 1) return null;

	// Window of up to 5 page numbers centered on the current page.
	const windowSize = 5;
	let start = Math.max(1, page - Math.floor(windowSize / 2));
	const end = Math.min(pageCount, start + windowSize - 1);
	start = Math.max(1, end - windowSize + 1);
	const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

	return (
		<nav
			className="flex items-center justify-center gap-1 pt-4"
			aria-label={t("pagination")}
		>
			<Button
				variant="ghost"
				size="sm"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
			>
				«
			</Button>
			{start > 1 ? (
				<>
					<Button variant="ghost" size="sm" onClick={() => onPageChange(1)}>
						1
					</Button>
					{start > 2 ? (
						<span className="px-1 text-muted-foreground">…</span>
					) : null}
				</>
			) : null}
			{pages.map((p) => (
				<Button
					key={p}
					variant={p === page ? "default" : "ghost"}
					size="sm"
					className={
						p === page
							? "bg-primary text-primary-foreground hover:bg-primary/90"
							: ""
					}
					onClick={() => onPageChange(p)}
				>
					{p}
				</Button>
			))}
			{end < pageCount ? (
				<>
					{end < pageCount - 1 ? (
						<span className="px-1 text-muted-foreground">…</span>
					) : null}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onPageChange(pageCount)}
					>
						{pageCount}
					</Button>
				</>
			) : null}
			<Button
				variant="ghost"
				size="sm"
				disabled={page >= pageCount}
				onClick={() => onPageChange(page + 1)}
			>
				»
			</Button>
		</nav>
	);
}
