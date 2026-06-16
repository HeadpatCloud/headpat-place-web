import { useCallback } from "react";

const STORAGE_KEY = "hp-recent-chats";
const CAP = 8;

export type RecentKind = "dm" | "channel";
export type RecentChat = { kind: RecentKind; id: string; at: number };

export function pushRecent(
	list: RecentChat[],
	kind: RecentKind,
	id: string,
	cap = CAP,
): RecentChat[] {
	const without = list
		.filter((r) => !(r.kind === kind && r.id === id))
		.sort((a, b) => b.at - a.at);
	return [{ kind, id, at: Date.now() }, ...without].slice(0, cap);
}

function read(): RecentChat[] {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(r): r is RecentChat =>
				r &&
				(r.kind === "dm" || r.kind === "channel") &&
				typeof r.id === "string" &&
				typeof r.at === "number",
		);
	} catch {
		return [];
	}
}

function write(list: RecentChat[]) {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useRecentChats() {
	const push = useCallback((kind: RecentKind, id: string) => {
		write(pushRecent(read(), kind, id));
	}, []);
	const list = useCallback(() => read(), []);
	return { push, list };
}
