import { useMemo } from "react";
import { useUser } from "@/components/contexts/UserContext";

type DateInput = string | number | Date;

// Formats timestamps in the signed-in user's chosen timezone, falling back to
// the browser's local timezone when unset or signed out.
export function useDateFormat() {
	const { userData } = useUser();
	const timeZone = userData?.timezone ?? undefined;

	return useMemo(
		() => ({
			timeZone,
			dateTime: (d: DateInput) =>
				new Date(d).toLocaleString(undefined, { timeZone }),
			date: (d: DateInput, opts?: Intl.DateTimeFormatOptions) =>
				new Date(d).toLocaleDateString(undefined, { timeZone, ...opts }),
			time: (d: DateInput, opts?: Intl.DateTimeFormatOptions) =>
				new Date(d).toLocaleTimeString(undefined, { timeZone, ...opts }),
		}),
		[timeZone],
	);
}
