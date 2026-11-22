import { describe, expect, test } from "bun:test";
import { applyDrop, type ChatLayout, reconcileLayout } from "./sidebar-layout";

const server = (id: string) => ({ type: "server" as const, id });
const folder = (id: string, serverIds: string[], name = "F") => ({
	type: "folder" as const,
	id,
	name,
	serverIds,
});

describe("reconcileLayout", () => {
	test("drops unfollowed servers and emptied folders", () => {
		const stored: ChatLayout = {
			items: [server("a"), folder("f1", ["b", "c"]), folder("f2", ["d"])],
		};
		const out = reconcileLayout(stored, ["a", "b"]);
		expect(out.items).toEqual([server("a"), folder("f1", ["b"])]);
	});

	test("appends newly followed servers at the end in followedIds order", () => {
		const stored: ChatLayout = { items: [server("a")] };
		const out = reconcileLayout(stored, ["a", "x", "y"]);
		expect(out.items).toEqual([server("a"), server("x"), server("y")]);
	});

	test("dedupes a server id appearing in multiple places, first wins", () => {
		const stored: ChatLayout = {
			items: [server("a"), folder("f1", ["a", "b"])],
		};
		const out = reconcileLayout(stored, ["a", "b"]);
		expect(out.items).toEqual([server("a"), folder("f1", ["b"])]);
	});
});

const opts = { makeFolderId: () => "new", makeFolderName: "New" };
const ids = (l: ChatLayout) =>
	l.items.map((i) => (i.type === "server" ? i.id : `${i.id}[${i.serverIds}]`));

describe("applyDrop", () => {
	test("reorders top-level servers before and after an anchor", () => {
		const layout: ChatLayout = {
			items: [server("a"), server("b"), server("c")],
		};
		expect(
			ids(
				applyDrop(
					layout,
					"a",
					{ kind: "top", anchorId: "c", side: "after" },
					opts,
				),
			),
		).toEqual(["b", "c", "a"]);
		expect(
			ids(
				applyDrop(
					layout,
					"c",
					{ kind: "top", anchorId: "a", side: "before" },
					opts,
				),
			),
		).toEqual(["c", "a", "b"]);
	});

	test("combining two servers makes a folder in the target's slot", () => {
		const layout: ChatLayout = {
			items: [server("a"), server("b"), server("c")],
		};
		const out = applyDrop(
			layout,
			"c",
			{ kind: "combine", targetId: "a" },
			opts,
		);
		expect(ids(out)).toEqual(["new[a,c]", "b"]);
	});

	test("combining onto a folder appends the server to it", () => {
		const layout: ChatLayout = { items: [folder("f1", ["b"]), server("a")] };
		const out = applyDrop(
			layout,
			"a",
			{ kind: "combine", targetId: "f1" },
			opts,
		);
		expect(ids(out)).toEqual(["f1[b,a]"]);
	});

	test("inserts a server into a folder at an exact position", () => {
		const layout: ChatLayout = {
			items: [folder("f1", ["b", "c"]), server("a")],
		};
		const out = applyDrop(
			layout,
			"a",
			{ kind: "folder", folderId: "f1", anchorId: "c", side: "before" },
			opts,
		);
		expect(ids(out)).toEqual(["f1[b,a,c]"]);
		const first = applyDrop(
			layout,
			"a",
			{ kind: "folder", folderId: "f1", anchorId: null, side: "before" },
			opts,
		);
		expect(ids(first)).toEqual(["f1[a,b,c]"]);
	});

	test("reorders servers within the same folder", () => {
		const layout: ChatLayout = { items: [folder("f1", ["a", "b", "c"])] };
		const out = applyDrop(
			layout,
			"a",
			{ kind: "folder", folderId: "f1", anchorId: "c", side: "after" },
			opts,
		);
		expect(ids(out)).toEqual(["f1[b,c,a]"]);
	});

	test("drags a server out of a folder and drops the emptied folder", () => {
		const layout: ChatLayout = { items: [folder("f1", ["a"]), server("c")] };
		const out = applyDrop(
			layout,
			"a",
			{ kind: "top", anchorId: "c", side: "after" },
			opts,
		);
		expect(ids(out)).toEqual(["c", "a"]);
		const end = applyDrop(
			{ items: [folder("f1", ["a", "b"]), server("c")] },
			"a",
			{ kind: "top-end" },
			opts,
		);
		expect(ids(end)).toEqual(["f1[b]", "c", "a"]);
	});

	test("moves a whole folder between top-level slots", () => {
		const layout: ChatLayout = {
			items: [server("a"), folder("f1", ["b", "c"]), server("d")],
		};
		const out = applyDrop(
			layout,
			"f1",
			{ kind: "top", anchorId: "a", side: "before" },
			opts,
		);
		expect(ids(out)).toEqual(["f1[b,c]", "a", "d"]);
	});

	test("refuses to nest a folder or drop an item onto itself", () => {
		const layout: ChatLayout = {
			items: [folder("f1", ["b"]), folder("f2", ["c"])],
		};
		expect(
			applyDrop(layout, "f1", { kind: "combine", targetId: "f2" }, opts),
		).toBe(layout);
		expect(
			applyDrop(
				layout,
				"f1",
				{ kind: "folder", folderId: "f2", anchorId: null, side: "after" },
				opts,
			),
		).toBe(layout);
		expect(
			applyDrop(
				layout,
				"b",
				{ kind: "top", anchorId: "b", side: "after" },
				opts,
			),
		).toBe(layout);
	});

	test("never duplicates a moved server id across the tree", () => {
		const layout: ChatLayout = {
			items: [folder("f1", ["a", "b"]), folder("f2", ["c"])],
		};
		const out = applyDrop(
			layout,
			"a",
			{ kind: "combine", targetId: "f2" },
			opts,
		);
		const placed = out.items.flatMap((i) =>
			i.type === "server" ? [i.id] : i.serverIds,
		);
		expect(placed.filter((id) => id === "a")).toHaveLength(1);
	});
});
