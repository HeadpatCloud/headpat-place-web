import { applyDrop, type ChatLayout, type RailDrop } from "./sidebar-layout";

/** What a droppable rail row is, attached as dnd-kit droppable data. */
export type RailRow =
	| { type: "server"; id: string }
	| { type: "folder"; id: string; expanded: boolean }
	| { type: "child"; id: string; folderId: string }
	| { type: "end" };

export type RailIndicator = {
	rowKey: string;
	pos: "top" | "bottom" | "combine";
};

export type RailTarget = { drop: RailDrop; indicator: RailIndicator };

export const rowKey = (row: RailRow) =>
	row.type === "end" ? "row:end" : `row:${row.id}`;

/** Serialises a row onto its element so hit-testing can read it back. */
export function rowDataAttrs(row: RailRow): Record<string, string> {
	const attrs: Record<string, string> = { "data-rail-row": row.type };
	if (row.type !== "end") attrs["data-rail-id"] = row.id;
	if (row.type === "child") attrs["data-rail-folder"] = row.folderId;
	if (row.type === "folder")
		attrs["data-rail-expanded"] = row.expanded ? "1" : "0";
	return attrs;
}

export function readRowAttrs(el: HTMLElement): RailRow | null {
	const { railRow: type, railId: id, railFolder, railExpanded } = el.dataset;
	if (type === "end") return { type: "end" };
	if (!id) return null;
	if (type === "server") return { type: "server", id };
	if (type === "folder")
		return { type: "folder", id, expanded: railExpanded === "1" };
	if (type === "child" && railFolder)
		return { type: "child", id, folderId: railFolder };
	return null;
}

/**
 * Turns the hovered row plus the pointer's relative height inside it
 * (0 = top edge, 1 = bottom edge) into a drop target. Servers combine when
 * hovering the middle of a top-level server or folder, like Discord; the
 * outer quarters insert before or after.
 */
export function resolveRailTarget(
	row: RailRow,
	rel: number,
	activeKind: "server" | "folder",
): RailTarget | null {
	const key = rowKey(row);
	if (row.type === "end")
		return {
			drop: { kind: "top-end" },
			indicator: { rowKey: key, pos: "top" },
		};

	if (activeKind === "folder") {
		if (row.type === "child") return null;
		const side = rel < 0.5 ? "before" : "after";
		return {
			drop: { kind: "top", anchorId: row.id, side },
			indicator: { rowKey: key, pos: side === "before" ? "top" : "bottom" },
		};
	}

	if (row.type === "child") {
		const side = rel < 0.5 ? "before" : "after";
		return {
			drop: { kind: "folder", folderId: row.folderId, anchorId: row.id, side },
			indicator: { rowKey: key, pos: side === "before" ? "top" : "bottom" },
		};
	}

	if (rel < 0.25)
		return {
			drop: { kind: "top", anchorId: row.id, side: "before" },
			indicator: { rowKey: key, pos: "top" },
		};
	if (rel > 0.75) {
		// below an open folder's icon means "first inside the folder"
		const drop: RailDrop =
			row.type === "folder" && row.expanded
				? { kind: "folder", folderId: row.id, anchorId: null, side: "before" }
				: { kind: "top", anchorId: row.id, side: "after" };
		return { drop, indicator: { rowKey: key, pos: "bottom" } };
	}
	return {
		drop: { kind: "combine", targetId: row.id },
		indicator: { rowKey: key, pos: "combine" },
	};
}

const sameLayout = (a: ChatLayout, b: ChatLayout) =>
	a === b || JSON.stringify(a.items) === JSON.stringify(b.items);

/** Drops that would leave the layout as it is get no indicator. */
export function isNoopDrop(
	layout: ChatLayout,
	activeId: string,
	drop: RailDrop,
): boolean {
	const next = applyDrop(layout, activeId, drop, {
		makeFolderId: () => "preview",
		makeFolderName: "",
	});
	return sameLayout(layout, next);
}
