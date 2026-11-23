import {
	Loader2Icon,
	SendHorizontalIcon,
	SquareIcon,
	TrashIcon,
} from "lucide-react";
import { VoicePlayer } from "@/components/chat/VoicePlayer";
import type {
	VoiceRecorderStatus,
	VoiceRecording,
} from "@/hooks/use-voice-recorder";
import { useTranslations } from "@/lib/i18n";
import { formatVoiceDuration, VOICE_MAX_MS } from "@/lib/voice";

type Props = {
	status: Exclude<VoiceRecorderStatus, "idle">;
	elapsedMs: number;
	recording: VoiceRecording | null;
	sending: boolean;
	onStop: () => void;
	onDiscard: () => void;
	onSend: () => void;
};

// Takes the composer's place while recording and while previewing the take.
export function VoiceComposerBar({
	status,
	elapsedMs,
	recording,
	sending,
	onStop,
	onDiscard,
	onSend,
}: Props) {
	const t = useTranslations("chatUi");
	const iconButton =
		"flex size-9.5 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50";
	return (
		<div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-1.5 py-1.5">
			<button
				type="button"
				onClick={onDiscard}
				disabled={sending}
				className={`${iconButton} text-muted-foreground hover:bg-destructive/10 hover:text-destructive`}
				aria-label={t("voiceDiscard")}
			>
				<TrashIcon className="size-4" />
			</button>
			{status === "recorded" && recording ? (
				<>
					<VoicePlayer
						src={recording.url}
						durationMs={recording.durationMs}
						className="max-w-none flex-1 border-0 bg-transparent px-0 py-0"
					/>
					<button
						type="button"
						onClick={onSend}
						disabled={sending}
						className={`${iconButton} bg-primary text-primary-foreground hover:brightness-110`}
						aria-label={t("voiceSend")}
					>
						{sending ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							<SendHorizontalIcon className="size-4" />
						)}
					</button>
				</>
			) : (
				<>
					<div className="flex flex-1 items-center gap-2.5 px-1">
						<span className="relative flex size-2.5">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
							<span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
						</span>
						<span className="text-sm font-semibold text-foreground">
							{status === "starting" ? t("voiceStarting") : t("voiceRecording")}
						</span>
						<span className="ml-auto text-xs tabular-nums text-muted-foreground">
							{formatVoiceDuration(elapsedMs)} /{" "}
							{formatVoiceDuration(VOICE_MAX_MS)}
						</span>
					</div>
					<button
						type="button"
						onClick={onStop}
						disabled={status !== "recording"}
						className={`${iconButton} bg-destructive text-destructive-foreground hover:brightness-110`}
						aria-label={t("voiceStop")}
					>
						<SquareIcon className="size-3.5 fill-current" />
					</button>
				</>
			)}
		</div>
	);
}
