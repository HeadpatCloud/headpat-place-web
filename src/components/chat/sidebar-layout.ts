export type ChatLayoutItem =
	| { type: "server"; id: string }
	| {
			type: "folder";
			id: string;
			name: string;
			color?: string;
			serverIds: string[];
	  };

export type ChatLayout = { items: ChatLayoutItem[] };

// client copy of the API reconcileLayout (src/lib/chat-layout.ts) — same algorithm.
export function reconcileLayout(
	stored: ChatLayout,
	followedIds: string[],
): ChatLayout {
	const followed = new Set(followedIds);
	const seen = new Set<string>();
	const items: ChatLayoutItem[] = [];

	for (const item of stored.items) {
		if (item.type === "server") {
			if (!followed.has(item.id) || seen.has(item.id)) continue;
			seen.add(item.id);
			items.push({ type: "server", id: item.id });
			continue;
		}
		const serverIds = item.serverIds.filter((id) => {
			if (!followed.has(id) || seen.has(id)) return false;
			seen.add(id);
			return true;
		});
		if (serverIds.length === 0) continue;
		items.push({ ...item, serverIds });
	}

	for (const id of followedIds) {
		if (seen.has(id)) continue;
		seen.add(id);
		items.push({ type: "server", id });
	}

	return { items };
}

/** Where a dragged rail item lands. */
export type RailDrop =
	| { kind: "top"; anchorId: string; side: "before" | "after" }
	| { kind: "top-end" }
	| {
			kind: "folder";
			folderId: string;
			anchorId: string | null;
			side: "before" | "after";
	  }
	| { kind: "combine"; targetId: string };

function removeItem(items: ChatLayoutItem[], id: string): ChatLayoutItem[] {
	return items
		.map((item) => {
			if (item.type === "server") return item.id === id ? null : item;
			if (item.id === id) return null;
			const serverIds = item.serverIds.filter((s) => s !== id);
			if (serverIds.length === 0) return null;
			return serverIds.length === item.serverIds.length
				? item
				: { ...item, serverIds };
		})
		.filter((item): item is ChatLayoutItem => item !== null);
}

function insertAt<T>(list: T[], index: number, value: T): T[] {
	const next = list.slice();
	next.splice(index, 0, value);
	return next;
}

/**
 * Moves a server or folder (`activeId`) to `drop`. Folders only move between
 * top-level slots; servers can also go into a folder or combine with another
 * top-level server into a new folder. Invalid or no-op drops return the
 * layout unchanged.
 */
export function applyDrop(
	layout: ChatLayout,
	activeId: string,
	drop: RailDrop,
	opts: { makeFolderId: () => string; makeFolderName: string },
): ChatLayout {
	const activeItem = layout.items.find((i) => i.id === activeId);
	const activeIsFolder = activeItem?.type === "folder";
	const known =
		activeItem !== undefined ||
		layout.items.some(
			(i) => i.type === "folder" && i.serverIds.includes(activeId),
		);
	if (!known) return layout;
	const anchor =
		drop.kind === "top" || drop.kind === "folder"
			? drop.anchorId
			: drop.kind === "combine"
				? drop.targetId
				: null;
	if (anchor === activeId) return layout;
	if (activeIsFolder && (drop.kind === "folder" || drop.kind === "combine"))
		return layout;
	if (drop.kind === "folder" && drop.folderId === activeId) return layout;

	const moved: ChatLayoutItem =
		activeItem ?? ({ type: "server", id: activeId } as const);
	const stripped = removeItem(layout.items, activeId);

	if (drop.kind === "top-end") return { items: [...stripped, moved] };

	if (drop.kind === "top") {
		const idx = stripped.findIndex((i) => i.id === drop.anchorId);
		if (idx === -1) return layout;
		const at = drop.side === "before" ? idx : idx + 1;
		return { items: insertAt(stripped, at, moved) };
	}

	if (drop.kind === "folder") {
		const fIdx = stripped.findIndex(
			(i) => i.type === "folder" && i.id === drop.folderId,
		);
		const folder = stripped[fIdx];
		// the folder vanished because the active server was its only member
		if (!folder || folder.type !== "folder") return layout;
		let at = 0;
		if (drop.anchorId !== null) {
			const aIdx = folder.serverIds.indexOf(drop.anchorId);
			if (aIdx === -1) return layout;
			at = drop.side === "before" ? aIdx : aIdx + 1;
		} else if (drop.side === "after") {
			at = folder.serverIds.length;
		}
		const next = stripped.slice();
		next[fIdx] = {
			...folder,
			serverIds: insertAt(folder.serverIds, at, activeId),
		};
		return { items: next };
	}

	// combine: onto a top-level server (new folder) or into a folder (append)
	const tIdx = stripped.findIndex((i) => i.id === drop.targetId);
	const target = stripped[tIdx];
	if (!target) return layout;
	const next = stripped.slice();
	next[tIdx] =
		target.type === "folder"
			? { ...target, serverIds: [...target.serverIds, activeId] }
			: {
					type: "folder",
					id: opts.makeFolderId(),
					name: opts.makeFolderName,
					serverIds: [target.id, activeId],
				};
	return { items: next };
}
