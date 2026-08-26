import { describe, expect, test } from "bun:test";
import { isNotFoundError, retryUnlessNotFound } from "./query-retry";

describe("isNotFoundError", () => {
	test("detects the API's NOT_FOUND code", () => {
		expect(isNotFoundError({ code: "NOT_FOUND" })).toBe(true);
	});

	test("other API codes are not not-found", () => {
		expect(isNotFoundError({ code: "INTERNAL_ERROR" })).toBe(false);
		expect(isNotFoundError({ code: "FORBIDDEN" })).toBe(false);
	});

	test("survives errors with no code at all", () => {
		expect(isNotFoundError(new Error("network"))).toBe(false);
		expect(isNotFoundError(null)).toBe(false);
		expect(isNotFoundError(undefined)).toBe(false);
	});
});

describe("retryUnlessNotFound", () => {
	test("never retries a genuine 404", () => {
		expect(retryUnlessNotFound(0, { code: "NOT_FOUND" })).toBe(false);
	});

	test("retries transient failures a few times, then stops", () => {
		const err = { code: "INTERNAL_ERROR" };
		expect(retryUnlessNotFound(0, err)).toBe(true);
		expect(retryUnlessNotFound(2, err)).toBe(true);
		expect(retryUnlessNotFound(3, err)).toBe(false);
	});

	test("retries a bare network error", () => {
		expect(retryUnlessNotFound(0, new Error("Failed to fetch"))).toBe(true);
	});
});
