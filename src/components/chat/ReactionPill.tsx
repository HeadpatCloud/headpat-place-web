import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	type ReactorGroup,
	summarizeNames,
} from "@/components/chat/reactor-summary";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";

type Props = {
	messageId: string;
	emoji: string;
	count: number;
	mine: boolean;
	onReact: (emoji: string) => void;
	onOpenModal: (emoji: string) => void;
};

const nameOf = (u: ReactorGroup["users"][number]) =>
	u.displayName || u.name || u.profileUrl || u.userId.slice(0, 8);

export function ReactionPill({
	messageId,
	emoji,
	count,
	mine,
	onReact,
	onOpenModal,
}: Props) {
	const t = useTranslations("chatUi");
	const [opened, setOpened] = useState(false);

	const reactorsQ = useQuery({
		...orpc.message.reactors.queryOptions({ input: { messageId } }),
		enabled: opened,
	});

	const group = reactorsQ.data?.reactions.find((r) => r.emoji === emoji);
	const { shown, moreCount } = summarizeNames(
		(group?.users ?? []).map(nameOf),
		group?.count ?? count,
	);

	return (
		<HoverCard
			openDelay={200}
			onOpenChange={(o) => {
				if (o) setOpened(true);
			}}
		>
			<HoverCardTrigger asChild>
				<button
					type="button"
					onClick={() => onReact(emoji)}
					className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
						mine
							? "border-primary/40 bg-primary/15 text-foreground"
							: "border-border bg-card text-muted-foreground hover:bg-muted"
					}`}
				>
					<span className="text-sm leading-none">{emoji}</span>
					<span className="tabular-nums">{count}</span>
				</button>
			</HoverCardTrigger>
			<HoverCardContent className="w-56 p-3" align="start">
				<div className="flex items-start gap-2.5">
					<span className="text-xl leading-none">{emoji}</span>
					<div className="min-w-0 flex-1 text-sm">
						<p className="text-muted-foreground">{t("reactedBy")}</p>
						<p className="mt-0.5 break-words text-foreground">
							{shown.length === 0
								? "…"
								: moreCount > 0
									? `${shown.join(", ")} ${t("andNMore", { count: moreCount })}`
									: shown.join(", ")}
						</p>
						<button
							type="button"
							onClick={() => onOpenModal(emoji)}
							className="mt-1.5 text-xs text-primary hover:underline"
						>
							{moreCount > 0
								? t("andNMore", { count: moreCount })
								: t("reactionsTitle")}
						</button>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
