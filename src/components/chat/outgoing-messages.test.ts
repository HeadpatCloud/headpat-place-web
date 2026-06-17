import { describe, expect, test } from "bun:test";
import {
	addOutgoing,
	type OutgoingMessage,
	removeOutgoing,
	setOutgoingStatus,
} from "./outgoing-messages";

function msg(
	tempId: string,
	status: OutgoingMessage["status"] = "sending",
): OutgoingMessage {
	return {
		tempId,
		body: tempId,
		attachments: [],
		createdAt: 0,
		status,
	};
}

describe("addOutgoing", () => {
	test("appends to the end preserving order", () => {
		const list = [msg("a"), msg("b")];
		const result = addOutgoing(list, msg("c"));
		expect(result.map((m) => m.tempId)).toEqual(["a", "b", "c"]);
	});

	test("does not mutate the input list", () => {
		const list = [msg("a")];
		addOutgoing(list, msg("b"));
		expect(list.map((m) => m.tempId)).toEqual(["a"]);
	});
});

describe("setOutgoingStatus", () => {
	test("only changes the matching entry", () => {
		const list = [msg("a"), msg("b")];
		const result = setOutgoingStatus(list, "b", "failed");
		expect(result[0].status).toBe("sending");
		expect(result[1].status).toBe("failed");
	});

	test("is immutable and leaves other entries by reference", () => {
		const list = [msg("a"), msg("b")];
		const result = setOutgoingStatus(list, "b", "failed");
		expect(result).not.toBe(list);
		expect(result[0]).toBe(list[0]);
		expect(result[1]).not.toBe(list[1]);
		expect(list[1].status).toBe("sending");
	});

	test("no-op when tempId is missing", () => {
		const list = [msg("a")];
		const result = setOutgoingStatus(list, "x", "failed");
		expect(result.map((m) => m.status)).toEqual(["sending"]);
	});
});

describe("removeOutgoing", () => {
	test("drops only the matching entry", () => {
		const list = [msg("a"), msg("b"), msg("c")];
		const result = removeOutgoing(list, "b");
		expect(result.map((m) => m.tempId)).toEqual(["a", "c"]);
	});

	test("is immutable", () => {
		const list = [msg("a"), msg("b")];
		const result = removeOutgoing(list, "a");
		expect(result).not.toBe(list);
		expect(list.map((m) => m.tempId)).toEqual(["a", "b"]);
	});

	test("no-op when tempId is missing", () => {
		const list = [msg("a")];
		const result = removeOutgoing(list, "x");
		expect(result.map((m) => m.tempId)).toEqual(["a"]);
	});
});
