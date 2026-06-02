import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { BACKEND_URL, orpc } from "@/lib/orpc";

type Status = "online" | "away" | "dnd" | "offline";
type Entry = {
	status: Status;
	customStatus: string | null;
	customStatusEmoji: string | null;
};

type WsIn = {
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
	conversationId?: string;
	channelId?: string;
	message?: { senderId?: string };
};

type Ctx = {
	presenceOf: (userId: string) => Entry | undefined;
	typingIn: (conversationId: string) => string[];
	sendTyping: (conversationId: string) => void;
	sendChannelTyping: (channelId: string) => void;
};

const PresenceContext = createContext<Ctx>({
	presenceOf: () => undefined,
	typingIn: () => [],
	sendTyping: () => {},
	sendChannelTyping: () => {},
});

export function usePresence() {
	return useContext(PresenceContext);
}

const TYPING_TTL_MS = 5000;
const TYPING_THROTTLE_MS = 3000;

export function PresenceProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const signedIn = !!session?.user;
	const queryClient = useQueryClient();
	const [map, setMap] = useState<Record<string, Entry>>({});
	// conversationId -> userId -> expiry timestamp (ms)
	const [typing, setTyping] = useState<Record<string, Record<string, number>>>(
		{},
	);
	const wsRef = useRef<WebSocket | null>(null);
	const lastTypingSent = useRef<Record<string, number>>({});

	useEffect(() => {
		if (!signedIn) {
			setMap({});
			setTyping({});
			return;
		}
		let heartbeat: ReturnType<typeof setInterval> | null = null;
		let retry: ReturnType<typeof setTimeout> | null = null;
		let closed = false;
		const wsUrl = `${BACKEND_URL.replace(/^http/, "ws")}/api/ws`;

		function connect() {
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;
			ws.onopen = () => {
				heartbeat = setInterval(
					() =>
						ws.readyState === WebSocket.OPEN &&
						ws.send(JSON.stringify({ type: "heartbeat" })),
					30_000,
				);
				queryClient.invalidateQueries({ queryKey: orpc.message.list.key() });
				queryClient.invalidateQueries({
					queryKey: orpc.message.myConversations.key(),
				});
			};
			ws.onmessage = (e) => {
				let msg: WsIn;
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
					const id = msg.userId;
					setMap((prev) => ({
						...prev,
						[id]: {
							status: msg.status as Status,
							customStatus: msg.customStatus ?? null,
							customStatusEmoji: msg.customStatusEmoji ?? null,
						},
					}));
				} else if (
					msg.type === "message" &&
					(msg.conversationId || msg.channelId)
				) {
					queryClient.invalidateQueries({ queryKey: orpc.message.list.key() });
					queryClient.invalidateQueries({
						queryKey: orpc.message.myConversations.key(),
					});
					queryClient.invalidateQueries({
						queryKey: orpc.channel.messages.key(),
					});
					const sender = msg.message?.senderId;
					const conv = msg.conversationId ?? msg.channelId;
					if (sender && conv) {
						setTyping((prev) => {
							const users = prev[conv];
							if (!users || !(sender in users)) return prev;
							const { [sender]: _removed, ...rest } = users;
							return { ...prev, [conv]: rest };
						});
					}
				} else if (
					msg.type === "typing" &&
					(msg.conversationId || msg.channelId) &&
					msg.userId
				) {
					const conv = (msg.conversationId ?? msg.channelId) as string;
					const who = msg.userId;
					setTyping((prev) => ({
						...prev,
						[conv]: {
							...(prev[conv] ?? {}),
							[who]: Date.now() + TYPING_TTL_MS,
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

		const prune = setInterval(() => {
			const now = Date.now();
			setTyping((prev) => {
				let changed = false;
				const next: Record<string, Record<string, number>> = {};
				for (const [conv, users] of Object.entries(prev)) {
					const kept: Record<string, number> = {};
					for (const [u, exp] of Object.entries(users)) {
						if (exp > now) kept[u] = exp;
						else changed = true;
					}
					next[conv] = kept;
				}
				return changed ? next : prev;
			});
		}, 1000);

		return () => {
			closed = true;
			if (heartbeat) clearInterval(heartbeat);
			if (retry) clearTimeout(retry);
			clearInterval(prune);
			wsRef.current?.close();
			wsRef.current = null;
		};
	}, [signedIn, queryClient]);

	function typingIn(conversationId: string): string[] {
		const now = Date.now();
		return Object.entries(typing[conversationId] ?? {})
			.filter(([, exp]) => exp > now)
			.map(([u]) => u);
	}

	function sendTyping(conversationId: string) {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		const now = Date.now();
		if (
			(lastTypingSent.current[conversationId] ?? 0) + TYPING_THROTTLE_MS >
			now
		)
			return;
		lastTypingSent.current[conversationId] = now;
		ws.send(JSON.stringify({ type: "typing", conversationId }));
	}

	function sendChannelTyping(channelId: string) {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		const now = Date.now();
		if ((lastTypingSent.current[channelId] ?? 0) + TYPING_THROTTLE_MS > now)
			return;
		lastTypingSent.current[channelId] = now;
		ws.send(JSON.stringify({ type: "typing", channelId }));
	}

	return (
		<PresenceContext.Provider
			value={{
				presenceOf: (id) => map[id],
				typingIn,
				sendTyping,
				sendChannelTyping,
			}}
		>
			{children}
		</PresenceContext.Provider>
	);
}
