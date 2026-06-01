import { usePresence } from "@/components/contexts/PresenceProvider";

const COLORS: Record<string, string> = {
	online: "bg-emerald-500",
	away: "bg-amber-500",
	dnd: "bg-red-500",
	offline: "bg-zinc-500",
};

export function StatusDot({
	userId,
	className = "",
}: {
	userId: string;
	className?: string;
}) {
	const { presenceOf } = usePresence();
	const status = presenceOf(userId)?.status ?? "offline";
	return (
		<span
			title={status}
			className={`size-3 rounded-full border-2 border-background ${COLORS[status]} ${className}`}
		/>
	);
}
