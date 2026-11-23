import { describe, expect, test } from "bun:test";
import {
	baseMime,
	formatVoiceDuration,
	pickRecorderMime,
	resampleWaveform,
} from "./voice";

describe("pickRecorderMime", () => {
	test("prefers AAC, falls back to Opus", () => {
		expect(pickRecorderMime(() => true)).toBe("audio/mp4");
		expect(pickRecorderMime((m) => m.startsWith("audio/webm"))).toBe(
			"audio/webm;codecs=opus",
		);
		expect(pickRecorderMime((m) => m.startsWith("audio/ogg"))).toBe(
			"audio/ogg;codecs=opus",
		);
		expect(pickRecorderMime(() => false)).toBeUndefined();
	});
});

describe("baseMime", () => {
	test("drops codec parameters", () => {
		expect(baseMime("audio/webm;codecs=opus")).toBe("audio/webm");
		expect(baseMime("audio/mp4")).toBe("audio/mp4");
		expect(baseMime("")).toBe("audio/webm");
	});
});

describe("formatVoiceDuration", () => {
	test("minutes and padded seconds", () => {
		expect(formatVoiceDuration(0)).toBe("0:00");
		expect(formatVoiceDuration(7400)).toBe("0:07");
		expect(formatVoiceDuration(83_000)).toBe("1:23");
		expect(formatVoiceDuration(300_000)).toBe("5:00");
		expect(formatVoiceDuration(-5)).toBe("0:00");
	});
});

describe("resampleWaveform", () => {
	test("squashes by peak and stretches by repeating", () => {
		expect(resampleWaveform([10, 90, 20, 40], 2)).toEqual([90, 40]);
		expect(resampleWaveform([10, 90], 4)).toEqual([10, 10, 90, 90]);
		expect(resampleWaveform([], 3)).toEqual([0, 0, 0]);
		expect(resampleWaveform([5], 0)).toEqual([]);
	});
});
