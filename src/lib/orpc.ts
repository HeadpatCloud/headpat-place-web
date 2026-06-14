import type { AppRouter } from "@backend/routes";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { isNetworkFailure, randomNetworkFailureMessage } from "./funny-errors";

function resolveBackendUrl(): string {
	const url =
		typeof window !== "undefined"
			? import.meta.env.VITE_API_URL || window.location.origin
			: process.env.VITE_API_URL ||
				process.env.BACKEND_ORIGIN ||
				"http://localhost:8787";
	// a trailing slash would break every `${BACKEND_URL}/path` concatenation
	return url.replace(/\/+$/, "");
}

export const BACKEND_URL = resolveBackendUrl();

const link = new RPCLink({
	url: `${BACKEND_URL}/api/rpc`,
	fetch: async (input, init) => {
		try {
			return await fetch(input, {
				...init,
				credentials: "include",
			});
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			if (isNetworkFailure(message))
				throw new Error(randomNetworkFailureMessage());
			throw e;
		}
	},
});

export const client = createORPCClient(link) as RouterClient<AppRouter>;
export const orpc = createTanstackQueryUtils(client);
