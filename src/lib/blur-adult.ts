import { useSyncExternalStore } from "react";

// Per-browser "blur 18+ pictures" switch, on unless turned off. Like the
// show-NSFW switch it stays on this device: a shared screen keeps its blur.
const KEY = "hp-blur-adult";
const listeners = new Set<() => void>();

function read(): boolean {
	try {
		return localStorage.getItem(KEY) !== "false";
	} catch {
		return true;
	}
}

export function setBlurAdult(on: boolean): void {
	try {
		localStorage.setItem(KEY, on ? "true" : "false");
	} catch {
		// storage blocked: the switch just won't stick
	}
	for (const l of listeners) l();
}

export function useBlurAdult(): boolean {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},
		read,
		() => true,
	);
}
