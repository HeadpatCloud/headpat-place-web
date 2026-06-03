import { describe, expect, test } from "bun:test";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
	test("black on white is 21", () => {
		expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
	});
	test("same color is 1", () => {
		expect(contrastRatio("#6b6ff0", "#6b6ff0")).toBeCloseTo(1, 5);
	});
	test("is symmetric", () => {
		expect(contrastRatio("#0e1014", "#cdd1d9")).toBeCloseTo(
			contrastRatio("#cdd1d9", "#0e1014"),
			5,
		);
	});
});
