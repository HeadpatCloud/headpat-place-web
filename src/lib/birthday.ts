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

/** Adult content is 18+. The stored birthday is always a full date — showDay and
 *  showYear only affect display — so age is computable even when the year is hidden. */
export function isAdult(birthday: string | Date | null | undefined): boolean {
	if (!birthday) return false;
	const d = new Date(birthday);
	if (Number.isNaN(d.getTime())) return false;
	const now = new Date();
	let age = now.getFullYear() - d.getFullYear();
	const months = now.getMonth() - d.getMonth();
	if (months < 0 || (months === 0 && now.getDate() < d.getDate())) age--;
	return age >= 18;
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
