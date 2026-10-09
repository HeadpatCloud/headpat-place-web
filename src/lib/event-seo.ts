type EventLike = {
	title: string;
	description?: string | null;
	startsAt: string | Date;
	endsAt?: string | Date | null;
	locationZoneMethod: string;
	locationText?: string | null;
	website?: string | null;
	isPaid?: boolean;
};

const MAX_DESCRIPTION = 500;

function iso(value: string | Date | null | undefined): string | undefined {
	if (!value) return undefined;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** schema.org/Event for Google's event rich result. Only fields we actually
 *  have are emitted; an event without a valid start date yields null because
 *  Google rejects the markup without one. */
export function eventJsonLd(ev: EventLike, url: string) {
	const startDate = iso(ev.startsAt);
	if (!startDate) return null;
	const online = ev.locationZoneMethod === "virtual";
	const description = ev.description
		?.replace(/\s+/g, " ")
		.trim()
		.slice(0, MAX_DESCRIPTION);
	return {
		"@context": "https://schema.org",
		"@type": "Event",
		name: ev.title,
		url,
		startDate,
		...(iso(ev.endsAt) ? { endDate: iso(ev.endsAt) } : {}),
		eventStatus: "https://schema.org/EventScheduled",
		eventAttendanceMode: online
			? "https://schema.org/OnlineEventAttendanceMode"
			: "https://schema.org/OfflineEventAttendanceMode",
		location: online
			? { "@type": "VirtualLocation", url: ev.website || url }
			: {
					"@type": "Place",
					name: ev.locationText || ev.title,
					address: ev.locationText || ev.title,
				},
		...(description ? { description } : {}),
		isAccessibleForFree: !ev.isPaid,
	};
}
