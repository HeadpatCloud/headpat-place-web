export type DayLabel =
	| { kind: "today" }
	| { kind: "yesterday" }
	| { kind: "date"; at: string };

/** Calendar day in the given timezone as YYYY-MM-DD, so messages group by the
 *  viewer's day rather than UTC's. */
export function dayKey(d: string | number | Date, timeZone?: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(d));
}

export function dayLabel(
	key: string,
	todayKey: string,
	yesterdayKey: string,
	at: string,
): DayLabel {
	if (key === todayKey) return { kind: "today" };
	if (key === yesterdayKey) return { kind: "yesterday" };
	return { kind: "date", at };
}

/** Indexes in `items` that should be preceded by a day separator: the first
 *  message, then every message that lands on a different day than the one
 *  before it. */
export function daySeparatorIndexes(
	items: { createdAt: string | number | Date }[],
	timeZone?: string,
): Map<number, string> {
	const out = new Map<number, string>();
	let prev: string | null = null;
	for (const [i, m] of items.entries()) {
		const key = dayKey(m.createdAt, timeZone);
		if (key !== prev) out.set(i, key);
		prev = key;
	}
	return out;
}
