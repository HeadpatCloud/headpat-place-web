/** Longest voice message the API accepts. */
export const VOICE_MAX_MS = 5 * 60 * 1000;

/** Recordings shorter than this are treated as an accidental tap. */
export const VOICE_MIN_MS = 500;

// AAC in MP4 first (Safari, newer Chrome), then Opus. The API converts
// whatever arrives to AAC, so this only decides what the browser records.
const RECORDER_MIMES = [
	"audio/mp4",
	"audio/webm;codecs=opus",
	"audio/ogg;codecs=opus",
	"audio/webm",
];

export function pickRecorderMime(
	isTypeSupported: (mime: string) => boolean,
): string | undefined {
	return RECORDER_MIMES.find((m) => isTypeSupported(m));
}

/** "audio/webm;codecs=opus" -> "audio/webm", what the upload is stored as. */
export function baseMime(mime: string): string {
	return mime.split(";")[0].trim() || "audio/webm";
}

/** 0:07, 1:23, 12:05 */
export function formatVoiceDuration(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Spread or squash stored bars to the number of bars we draw. */
export function resampleWaveform(bars: number[], count: number): number[] {
	if (count <= 0) return [];
	if (bars.length === 0) return new Array(count).fill(0);
	return Array.from({ length: count }, (_, i) => {
		const start = Math.floor((i * bars.length) / count);
		const end = Math.max(
			start + 1,
			Math.floor(((i + 1) * bars.length) / count),
		);
		let peak = 0;
		for (let j = start; j < end; j++) peak = Math.max(peak, bars[j] ?? 0);
		return peak;
	});
}
