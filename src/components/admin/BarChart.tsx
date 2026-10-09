import { useDateFormat } from "@/lib/datetime";

type Point = { date: string; count: number };

export function BarChart({ data, label }: { data: Point[]; label: string }) {
	const fmt = useDateFormat();
	const max = Math.max(1, ...data.map((d) => d.count));
	const total = data.reduce((n, d) => n + d.count, 0);
	const bar = 20;
	const gap = 8;
	const height = 96;
	const width = data.length * (bar + gap) - gap;
	return (
		<figure className="space-y-2">
			<svg
				viewBox={`0 0 ${width} ${height}`}
				role="img"
				aria-label={`${label}: ${total}`}
				className="h-28 w-full text-primary"
				preserveAspectRatio="none"
			>
				{data.map((d, i) => {
					const h = Math.max(d.count === 0 ? 2 : 6, (d.count / max) * height);
					return (
						<rect
							key={d.date}
							x={i * (bar + gap)}
							y={height - h}
							width={bar}
							height={h}
							rx={6}
							fill="currentColor"
							opacity={d.count === 0 ? 0.2 : 0.85}
						>
							<title>{`${fmt.date(`${d.date}T12:00:00Z`, { day: "numeric", month: "short", timeZone: "UTC" })}: ${d.count}`}</title>
						</rect>
					);
				})}
			</svg>
			<figcaption className="flex justify-between text-xs font-semibold text-muted-foreground">
				<span>
					{data[0]
						? fmt.date(`${data[0].date}T12:00:00Z`, {
								day: "numeric",
								month: "short",
								timeZone: "UTC",
							})
						: ""}
				</span>
				<span className="font-display text-sm text-foreground">{total}</span>
				<span>
					{data.at(-1)
						? fmt.date(`${data.at(-1)?.date}T12:00:00Z`, {
								day: "numeric",
								month: "short",
								timeZone: "UTC",
							})
						: ""}
				</span>
			</figcaption>
		</figure>
	);
}
