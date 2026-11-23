import { useCallback, useEffect, useRef, useState } from "react";
import { pickRecorderMime, VOICE_MAX_MS, VOICE_MIN_MS } from "@/lib/voice";

export type VoiceRecording = { blob: Blob; url: string; durationMs: number };

export type VoiceRecorderStatus =
	| "idle"
	| "starting"
	| "recording"
	| "recorded";

export type VoiceRecorderError = "unsupported" | "denied" | "failed";

export class VoiceRecorderFailure extends Error {
	constructor(readonly reason: VoiceRecorderError) {
		super(reason);
	}
}

/**
 * Microphone recording for voice messages: start, stop into a preview, then
 * the caller sends or discards it. Stops on its own at the length limit.
 */
export function useVoiceRecorder() {
	const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
	const [elapsedMs, setElapsedMs] = useState(0);
	const [recording, setRecording] = useState<VoiceRecording | null>(null);
	const recorder = useRef<MediaRecorder | null>(null);
	const stream = useRef<MediaStream | null>(null);
	const chunks = useRef<Blob[]>([]);
	const startedAt = useRef(0);
	const discardOnStop = useRef(false);

	const releaseMic = useCallback(() => {
		for (const track of stream.current?.getTracks() ?? []) track.stop();
		stream.current = null;
	}, []);

	const stop = useCallback(() => {
		if (recorder.current?.state === "recording") recorder.current.stop();
	}, []);

	const start = useCallback(async () => {
		if (
			typeof window === "undefined" ||
			!navigator.mediaDevices?.getUserMedia ||
			typeof MediaRecorder === "undefined"
		) {
			throw new VoiceRecorderFailure("unsupported");
		}
		setStatus("starting");
		let mic: MediaStream;
		try {
			mic = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true },
			});
		} catch (e) {
			setStatus("idle");
			const name = e instanceof DOMException ? e.name : "";
			throw new VoiceRecorderFailure(
				name === "NotAllowedError" || name === "SecurityError"
					? "denied"
					: "failed",
			);
		}
		stream.current = mic;
		const mimeType = pickRecorderMime((m) => MediaRecorder.isTypeSupported(m));
		let r: MediaRecorder;
		try {
			r = new MediaRecorder(
				mic,
				mimeType ? { mimeType, audioBitsPerSecond: 64_000 } : undefined,
			);
		} catch {
			releaseMic();
			setStatus("idle");
			throw new VoiceRecorderFailure("unsupported");
		}
		chunks.current = [];
		discardOnStop.current = false;
		r.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.current.push(e.data);
		};
		r.onstop = () => {
			releaseMic();
			recorder.current = null;
			const durationMs = Math.min(Date.now() - startedAt.current, VOICE_MAX_MS);
			if (discardOnStop.current || durationMs < VOICE_MIN_MS) {
				chunks.current = [];
				setStatus("idle");
				setElapsedMs(0);
				return;
			}
			const blob = new Blob(chunks.current, {
				type: r.mimeType || mimeType || "audio/webm",
			});
			chunks.current = [];
			setRecording({ blob, url: URL.createObjectURL(blob), durationMs });
			setElapsedMs(durationMs);
			setStatus("recorded");
		};
		recorder.current = r;
		startedAt.current = Date.now();
		setElapsedMs(0);
		r.start(250);
		setStatus("recording");
	}, [releaseMic]);

	/** Throw away a running recording or the finished preview. */
	const discard = useCallback(() => {
		if (recorder.current?.state === "recording") {
			discardOnStop.current = true;
			recorder.current.stop();
			return;
		}
		// The effect below revokes the preview's object URL.
		setRecording(null);
		setElapsedMs(0);
		setStatus("idle");
	}, []);

	// Tick the timer and stop at the limit.
	useEffect(() => {
		if (status !== "recording") return;
		const id = window.setInterval(() => {
			const ms = Date.now() - startedAt.current;
			setElapsedMs(ms);
			if (ms >= VOICE_MAX_MS) stop();
		}, 200);
		return () => window.clearInterval(id);
	}, [status, stop]);

	// Leaving the chat mid-recording must let go of the microphone.
	useEffect(
		() => () => {
			discardOnStop.current = true;
			if (recorder.current?.state === "recording") recorder.current.stop();
			releaseMic();
		},
		[releaseMic],
	);

	useEffect(
		() => () => {
			if (recording) URL.revokeObjectURL(recording.url);
		},
		[recording],
	);

	return { status, elapsedMs, recording, start, stop, discard };
}
