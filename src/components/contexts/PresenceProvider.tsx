import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { BACKEND_URL } from "@/lib/orpc";

type Status = "online" | "away" | "dnd" | "offline";
type Entry = {
	status: Status;
	customStatus: string | null;
	customStatusEmoji: string | null;
};

const PresenceContext = createContext<{
	presenceOf: (userId: string) => Entry | undefined;
}>({
	presenceOf: () => undefined,
});

export function usePresence() {
	return useContext(PresenceContext);
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const signedIn = !!session?.user;
	const [map, setMap] = useState<Record<string, Entry>>({});

	useEffect(() => {
		if (!signedIn) {
			setMap({});
			return;
		}
		let ws: WebSocket | null = null;
		let heartbeat: ReturnType<typeof setInterval> | null = null;
		let retry: ReturnType<typeof setTimeout> | null = null;
		let closed = false;

		const wsUrl = `${BACKEND_URL.replace(/^http/, "ws")}/api/ws`;

		function connect() {
			ws = new WebSocket(wsUrl);
			ws.onopen = () => {
				heartbeat = setInterval(
					() =>
						ws?.readyState === WebSocket.OPEN &&
						ws.send(JSON.stringify({ type: "heartbeat" })),
					30_000,
				);
			};
			ws.onmessage = (e) => {
				let msg: {
					type?: string;
					entries?: {
						userId: string;
						status: Status;
						customStatus: string | null;
						customStatusEmoji: string | null;
					}[];
					userId?: string;
					status?: Status;
					customStatus?: string | null;
					customStatusEmoji?: string | null;
				};
				try {
					msg = JSON.parse(e.data);
				} catch {
					return;
				}
				if (msg.type === "snapshot") {
					const next: Record<string, Entry> = {};
					for (const en of msg.entries ?? []) next[en.userId] = en;
					setMap((prev) => ({ ...prev, ...next }));
				} else if (msg.type === "presence" && msg.userId) {
					setMap((prev) => ({
						...prev,
						[msg.userId as string]: {
							status: msg.status as Status,
							customStatus: msg.customStatus ?? null,
							customStatusEmoji: msg.customStatusEmoji ?? null,
						},
					}));
				}
			};
			ws.onclose = () => {
				if (heartbeat) clearInterval(heartbeat);
				if (!closed) retry = setTimeout(connect, 3000);
			};
		}
		connect();

		return () => {
			closed = true;
			if (heartbeat) clearInterval(heartbeat);
			if (retry) clearTimeout(retry);
			ws?.close();
		};
	}, [signedIn]);

	return (
		<PresenceContext.Provider value={{ presenceOf: (id) => map[id] }}>
			{children}
		</PresenceContext.Provider>
	);
}
