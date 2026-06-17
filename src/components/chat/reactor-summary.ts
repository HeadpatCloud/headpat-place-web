export type ReactorUser = {
	userId: string;
	displayName: string | null;
	name: string | null;
	avatarFileId: string | null;
	profileUrl: string | null;
};

export type ReactorGroup = {
	emoji: string;
	count: number;
	users: ReactorUser[];
};

export function summarizeNames(
	names: string[],
	total: number,
	maxShown = 3,
): { shown: string[]; moreCount: number } {
	const shown = names.slice(0, maxShown);
	const moreCount = Math.max(0, total - shown.length);
	return { shown, moreCount };
}

export function distinctReactorCount(groups: ReactorGroup[]): number {
	const seen = new Set<string>();
	for (const group of groups) {
		for (const user of group.users) {
			seen.add(user.userId);
		}
	}
	return seen.size;
}

export function shouldShowAllTab(groups: ReactorGroup[]): boolean {
	return distinctReactorCount(groups) <= 100;
}

export function buildAllReactors(
	groups: ReactorGroup[],
): { user: ReactorUser; emojis: string[] }[] {
	const result: { user: ReactorUser; emojis: string[] }[] = [];
	const byUser = new Map<string, { user: ReactorUser; emojis: string[] }>();
	for (const group of groups) {
		for (const user of group.users) {
			let entry = byUser.get(user.userId);
			if (!entry) {
				entry = { user, emojis: [] };
				byUser.set(user.userId, entry);
				result.push(entry);
			}
			if (!entry.emojis.includes(group.emoji)) {
				entry.emojis.push(group.emoji);
			}
		}
	}
	return result;
}
