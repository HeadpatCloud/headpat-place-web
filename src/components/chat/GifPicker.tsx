import { lazy, Suspense, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "@/lib/i18n";
import { client } from "@/lib/orpc";

const Grid = lazy(() =>
	import("@giphy/react-components").then((m) => ({ default: m.Grid })),
);

export function GifPicker({ onSelect }: { onSelect: (url: string) => void }) {
	const t = useTranslations("chatUi");
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [debounced, setDebounced] = useState("");
	const [empty, setEmpty] = useState(false);

	useEffect(() => {
		const h = setTimeout(() => setDebounced(query.trim()), 300);
		return () => clearTimeout(h);
	}, [query]);

	const fetchGifs = (offset: number) =>
		debounced
			? client.gif.search({ q: debounced, pos: offset, limit: 24 })
			: client.gif.trending({ pos: offset, limit: 24 });

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="flex size-9.5 items-center justify-center rounded-xl text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label={t("gifButton")}
				>
					{t("gifButton")}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-fit p-2" align="end" side="top">
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t("gifSearchPlaceholder")}
					className="mb-2 w-[300px]"
				/>
				<div className="h-[320px] overflow-y-auto">
					{open ? (
						<Suspense
							fallback={
								<div className="h-full w-[300px] animate-pulse rounded-md bg-muted" />
							}
						>
							{empty ? (
								<p className="py-8 text-center text-sm text-muted-foreground">
									{t("gifsUnavailable")}
								</p>
							) : null}
							<Grid
								key={debounced}
								width={300}
								columns={2}
								gutter={6}
								user={{}}
								fetchGifs={fetchGifs}
								onGifsFetched={(gifs) => setEmpty(gifs.length === 0)}
								onGifClick={(gif, e) => {
									e.preventDefault();
									onSelect(gif.images.original.url);
									setOpen(false);
								}}
							/>
						</Suspense>
					) : null}
				</div>
			</PopoverContent>
		</Popover>
	);
}
