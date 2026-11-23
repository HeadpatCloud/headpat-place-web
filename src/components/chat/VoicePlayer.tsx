import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatVoiceDuration, resampleWaveform } from "@/lib/voice";

const BARS = 40;
const SPEEDS = [1, 1.5, 2] as const;
const FLAT = new Array(BARS).fill(35);

// Only one voice message plays at a time across the whole page.
let nowPlaying: HTMLAudioElement | null = null;

type Props = {
	src: string;
	/** Known length; MediaRecorder previews report no usable duration. */
	durationMs?: number | null;
	/** Loudness bars 0 to 100 from the API; flat bars when missing. */
	waveform?: number[] | null;
	className?: string;
};

export function VoicePlayer({ src, durationMs, waveform, className }: Props) {
	const t = useTranslations("chatUi");
	const audio = useRef<HTMLAudioElement>(null);
	const [playing, setPlaying] = useState(false);
	const [positionMs, setPositionMs] = useState(0);
	const [metaMs, setMetaMs] = useState<number | null>(null);
	const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
	const totalMs = durationMs ?? metaMs ?? 0;
	const bars = useMemo(
		() => (waveform?.length ? resampleWaveform(waveform, BARS) : FLAT),
		[waveform],
	);
	const progress = totalMs > 0 ? Math.min(1, positionMs / totalMs) : 0;

	useEffect(() => {
		if (audio.current) audio.current.playbackRate = speed;
	}, [speed]);

	useEffect(
		() => () => {
			if (nowPlaying === audio.current) nowPlaying = null;
		},
		[],
	);

	const toggle = () => {
		const el = audio.current;
		if (!el) return;
		if (!el.paused) {
			el.pause();
			return;
		}
		if (nowPlaying && nowPlaying !== el) nowPlaying.pause();
		nowPlaying = el;
		el.playbackRate = speed;
		void el.play().catch(() => setPlaying(false));
	};

	const seekTo = (fraction: number) => {
		const el = audio.current;
		if (!el || totalMs <= 0) return;
		const ms = Math.max(0, Math.min(1, fraction)) * totalMs;
		el.currentTime = ms / 1000;
		setPositionMs(ms);
	};

	return (
		<div
			className={cn(
				"flex w-full max-w-xs items-center gap-2.5 rounded-2xl border border-border bg-card px-2 py-1.5",
				className,
			)}
		>
			{/* biome-ignore lint/a11y/useMediaCaption: a voice message has no caption track */}
			<audio
				ref={audio}
				src={src}
				preload="metadata"
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onEnded={() => {
					setPlaying(false);
					setPositionMs(0);
				}}
				onTimeUpdate={(e) => setPositionMs(e.currentTarget.currentTime * 1000)}
				onLoadedMetadata={(e) => {
					const d = e.currentTarget.duration;
					if (Number.isFinite(d) && d > 0) setMetaMs(d * 1000);
				}}
			/>
			<button
				type="button"
				onClick={toggle}
				className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[filter] hover:brightness-110"
				aria-label={playing ? t("voicePause") : t("voicePlay")}
			>
				{playing ? (
					<PauseIcon className="size-4 fill-current" />
				) : (
					<PlayIcon className="ml-0.5 size-4 fill-current" />
				)}
			</button>
			<div
				role="slider"
				tabIndex={0}
				aria-label={t("voiceMessage")}
				aria-valuemin={0}
				aria-valuemax={Math.round(totalMs / 1000)}
				aria-valuenow={Math.round(positionMs / 1000)}
				aria-valuetext={formatVoiceDuration(positionMs)}
				className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-[2px] rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onClick={(e) => {
					const box = e.currentTarget.getBoundingClientRect();
					seekTo((e.clientX - box.left) / box.width);
				}}
				onKeyDown={(e) => {
					if (totalMs <= 0) return;
					const step = 5000 / totalMs;
					if (e.key === "ArrowRight") seekTo(progress + step);
					else if (e.key === "ArrowLeft") seekTo(progress - step);
					else if (e.key === " " || e.key === "Enter") toggle();
					else return;
					e.preventDefault();
				}}
			>
				{bars.map((h, i) => (
					<span
						key={i}
						className={cn(
							"w-[3px] flex-1 rounded-full transition-colors",
							(i + 0.5) / BARS <= progress
								? "bg-primary"
								: "bg-muted-foreground/35",
						)}
						style={{ height: `${Math.max(12, h)}%` }}
					/>
				))}
			</div>
			<span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
				{formatVoiceDuration(playing || positionMs > 0 ? positionMs : totalMs)}
			</span>
			<button
				type="button"
				onClick={() =>
					setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])
				}
				className="h-6 shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-bold tabular-nums text-muted-foreground hover:text-foreground"
				aria-label={t("voiceSpeed", { speed: String(speed) })}
			>
				{speed}x
			</button>
		</div>
	);
}
