import { describe, expect, test } from "bun:test";
import {
	applyDragResult,
	type ChatLayout,
	reconcileLayout,
} from "./sidebar-layout";

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

describe("applyDragResult", () => {
	test("reorders two top-level servers", () => {
		const layout: ChatLayout = {
			items: [server("a"), server("b"), server("c")],
		};
		const out = applyDragResult(layout, "a", "c", { makeFolderName: "New" });
		expect(out.items.map((i) => (i.type === "server" ? i.id : i.id))).toEqual([
			"b",
			"c",
			"a",
		]);
	});

	test("dropping a server onto another server makes a folder of both", () => {
		const layout: ChatLayout = {
			items: [server("a"), server("b"), server("c")],
		};
		const out = applyDragResult(layout, "a", "b", {
			makeFolderName: "New",
			intoFolder: true,
		});
		const f = out.items.find((i) => i.type === "folder");
		expect(f).toBeTruthy();
		if (f?.type === "folder") expect(f.serverIds).toEqual(["b", "a"]);
		expect(out.items.some((i) => i.type === "server" && i.id === "c")).toBe(
			true,
		);
		const placed = out.items.flatMap((i) =>
			i.type === "server" ? [i.id] : i.serverIds,
		);
		expect(placed.filter((id) => id === "a")).toHaveLength(1);
	});

	test("dropping a server onto a folder moves it into that folder", () => {
		const layout: ChatLayout = {
			items: [folder("f1", ["b"]), server("a")],
		};
		const out = applyDragResult(layout, "a", "f1", {
			makeFolderName: "New",
			intoFolder: true,
		});
		const f = out.items.find((i) => i.type === "folder");
		if (f?.type === "folder") expect(f.serverIds).toEqual(["b", "a"]);
		expect(out.items.some((i) => i.type === "server" && i.id === "a")).toBe(
			false,
		);
	});

	test("dropping a server from a folder onto top-level moves it out", () => {
		const layout: ChatLayout = {
			items: [folder("f1", ["a", "b"]), server("c")],
		};
		const out = applyDragResult(layout, "a", "c", { makeFolderName: "New" });
		const f = out.items.find((i) => i.type === "folder");
		if (f?.type === "folder") expect(f.serverIds).toEqual(["b"]);
		expect(out.items.some((i) => i.type === "server" && i.id === "a")).toBe(
			true,
		);
	});

	test("reorders servers within the same folder", () => {
		const layout: ChatLayout = {
			items: [folder("f1", ["a", "b", "c"])],
		};
		const out = applyDragResult(layout, "a", "c", { makeFolderName: "New" });
		const f = out.items.find((i) => i.type === "folder");
		if (f?.type === "folder") expect(f.serverIds).toEqual(["b", "c", "a"]);
		expect(out.items.some((i) => i.type === "server")).toBe(false);
	});

	test("never duplicates a moved server id across the tree", () => {
		const layout: ChatLayout = {
			items: [folder("f1", ["a", "b"]), folder("f2", ["c"])],
		};
		const out = applyDragResult(layout, "a", "f2", {
			makeFolderName: "New",
			intoFolder: true,
		});
		const placed = out.items.flatMap((i) =>
			i.type === "server" ? [i.id] : i.serverIds,
		);
		expect(placed.filter((id) => id === "a")).toHaveLength(1);
	});
});
