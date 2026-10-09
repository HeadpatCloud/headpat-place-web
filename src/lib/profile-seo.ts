import { type SocialProfile, socialLinks } from "@/lib/social";

const MAX_DESCRIPTION = 300;

export function profileJsonLd(opts: {
	url: string;
	name: string;
	handle: string;
	bio?: string | null;
	createdAt?: string | Date | null;
	social: SocialProfile;
}) {
	const description = opts.bio
		?.replace(/\s+/g, " ")
		.trim()
		.slice(0, MAX_DESCRIPTION);
	const sameAs = socialLinks(opts.social).flatMap((l) =>
		l.href ? [l.href] : [],
	);
	const created = opts.createdAt ? new Date(opts.createdAt) : null;
	return {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		url: opts.url,
		...(created && !Number.isNaN(created.getTime())
			? { dateCreated: created.toISOString() }
			: {}),
		mainEntity: {
			"@type": "Person",
			name: opts.name,
			alternateName: `@${opts.handle}`,
			identifier: opts.handle,
			url: opts.url,
			...(description ? { description } : {}),
			...(sameAs.length ? { sameAs } : {}),
		},
	};
}
