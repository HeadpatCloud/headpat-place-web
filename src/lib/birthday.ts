type Opts = { showDay: boolean; showYear: boolean };

/** "13 July 2000" / "July 2000" / "13 July" / "July" — month always shows.
 *  Viewer-local, matching the long-standing birthday rendering. */
export function formatBirthday(
	birthday: string | Date,
	{ showDay, showYear }: Opts,
): string {
	return new Date(birthday).toLocaleDateString("en-GB", {
		...(showDay ? { day: "numeric" } : {}),
		month: "long",
		...(showYear ? { year: "numeric" } : {}),
	});
}

/** The "it's my birthday" state is suppressed when the day is hidden, so it can't
 *  reveal a day the user chose not to show. */
export function isBirthdayToday(
	birthday: string | Date | null | undefined,
	showDay: boolean,
): boolean {
	if (!birthday || !showDay) return false;
	const d = new Date(birthday);
	if (Number.isNaN(d.getTime())) return false;
	const now = new Date();
	return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}
