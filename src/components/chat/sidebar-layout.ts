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

function removeServer(items: ChatLayoutItem[], id: string): ChatLayoutItem[] {
	return items
		.map((item) => {
			if (item.type === "server") return item.id === id ? null : item;
			const serverIds = item.serverIds.filter((s) => s !== id);
			if (serverIds.length === 0) return null;
			return { ...item, serverIds };
		})
		.filter((item): item is ChatLayoutItem => item !== null);
}

export function applyDragResult(
	layout: ChatLayout,
	activeId: string,
	overId: string,
	opts: { makeFolderName: string; intoFolder?: boolean },
): ChatLayout {
	if (activeId === overId) return layout;

	const stripped = removeServer(layout.items, activeId);

	// drop onto a folder -> move into it
	const overFolderIdx = stripped.findIndex(
		(i) => i.type === "folder" && i.id === overId,
	);
	if (overFolderIdx !== -1) {
		const next = stripped.slice();
		const folder = next[overFolderIdx];
		if (folder.type === "folder" && !folder.serverIds.includes(activeId)) {
			next[overFolderIdx] = {
				...folder,
				serverIds: [...folder.serverIds, activeId],
			};
		}
		return { items: next };
	}

	const overServerIdx = stripped.findIndex(
		(i) => i.type === "server" && i.id === overId,
	);

	// drop onto another server -> make a folder of both
	if (opts.intoFolder && overServerIdx !== -1) {
		const next = stripped.slice();
		next[overServerIdx] = {
			type: "folder",
			id: crypto.randomUUID(),
			name: opts.makeFolderName,
			serverIds: [overId, activeId],
		};
		return { items: next };
	}

	// reorder: place the active server relative to the over item's position
	const overIdx =
		overServerIdx !== -1
			? overServerIdx
			: stripped.findIndex((i) => i.type === "folder" && i.id === overId);
	if (overIdx === -1) {
		const next = stripped.slice();
		next.push({ type: "server", id: activeId });
		return { items: next };
	}

	const activeOrigin = layout.items.findIndex(
		(i) =>
			(i.type === "server" && i.id === activeId) ||
			(i.type === "folder" && i.serverIds.includes(activeId)),
	);
	const overOrigin = layout.items.findIndex(
		(i) =>
			(i.type === "server" && i.id === overId) ||
			(i.type === "folder" && i.id === overId),
	);
	// moving down (active was before over) drops after, otherwise before.
	const at = activeOrigin < overOrigin ? overIdx + 1 : overIdx;
	const next = stripped.slice();
	next.splice(at, 0, { type: "server", id: activeId });
	return { items: next };
}
