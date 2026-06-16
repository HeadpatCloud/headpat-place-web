import { describe, expect, test } from "bun:test";
import { pushRecent, type RecentChat } from "./use-recent-chats";

const at = (n: number): RecentChat["at"] => n;

describe("pushRecent", () => {
	test("prepends newest first", () => {
		const a: RecentChat = { kind: "dm", id: "1", at: at(1) };
		const b: RecentChat = { kind: "channel", id: "2", at: at(2) };
		const next = pushRecent([a], "channel", "2", 2);
		expect(next.map((r) => r.id)).toEqual(["2", "1"]);
		expect(next[0].kind).toBe(b.kind);
	});

	test("dedupes by (kind,id) and moves the existing entry to the front", () => {
		const list: RecentChat[] = [
			{ kind: "dm", id: "1", at: 1 },
			{ kind: "channel", id: "1", at: 2 },
			{ kind: "dm", id: "2", at: 3 },
		];
		const next = pushRecent(list, "dm", "1", 10);
		expect(next.map((r) => `${r.kind}:${r.id}`)).toEqual([
			"dm:1",
			"dm:2",
			"channel:1",
		]);
		expect(next.filter((r) => r.kind === "dm" && r.id === "1")).toHaveLength(1);
	});

	test("does not treat the same id under different kinds as a duplicate", () => {
		const list: RecentChat[] = [{ kind: "dm", id: "x", at: 1 }];
		const next = pushRecent(list, "channel", "x", 10);
		expect(next).toHaveLength(2);
	});

	test("caps at the given size, dropping the oldest", () => {
		let list: RecentChat[] = [];
		for (let i = 0; i < 12; i++) list = pushRecent(list, "dm", String(i), 8);
		expect(list).toHaveLength(8);
		expect(list[0].id).toBe("11");
		expect(list.at(-1)?.id).toBe("4");
	});

	test("defaults the cap to 8", () => {
		let list: RecentChat[] = [];
		for (let i = 0; i < 20; i++) list = pushRecent(list, "channel", String(i));
		expect(list).toHaveLength(8);
	});
});
