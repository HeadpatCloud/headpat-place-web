import { createContext, useContext, useEffect } from "react";
import { useUser } from "@/components/contexts/UserContext";
import { authClient } from "@/lib/auth-client";
import { hintCookie, parseHint, type SessionHint } from "@/lib/session-hint";

const HintContext = createContext<SessionHint | null>(null);

export const SessionHintProvider = HintContext.Provider;

/** Signed-in state for UI chrome. The session itself resolves client-side, so
 *  until it does we fall back on a cosmetic cookie from the last visit; it
 *  never grants access, the API still checks the real session. */
export function useAuthState() {
	const { data, isPending } = authClient.useSession();
	const hint = useContext(HintContext);
	if (!isPending) {
		return {
			signedIn: !!data?.user,
			pending: false,
			name: data?.user?.name ?? "",
			avatar: hint?.a ?? null,
		};
	}
	return {
		signedIn: !!hint,
		pending: false,
		name: hint?.n ?? "",
		avatar: hint?.a ?? null,
	};
}

export function SessionHintSync() {
	const { data, isPending } = authClient.useSession();
	const { userData } = useUser();
	const signedIn = !!data?.user;
	const name = userData?.displayName || data?.user?.name || "";
	const avatar = userData?.avatarId ?? null;

	useEffect(() => {
		if (isPending) return;
		const current = parseHint(document.cookie);
		if (!signedIn) {
			if (current) document.cookie = hintCookie(null);
			return;
		}
		if (current?.n === name && current.a === avatar) return;
		document.cookie = hintCookie({ n: name, a: avatar });
	}, [isPending, signedIn, name, avatar]);

	return null;
}
