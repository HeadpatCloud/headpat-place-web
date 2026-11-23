import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

/** Same rule as the API: exact grant, "resource:*", or "*:*". */
export function permits(perms: ReadonlySet<string>, required: string): boolean {
	if (perms.has("*:*") || perms.has(required)) return true;
	const resource = required.split(":")[0];
	return perms.has(`${resource}:*`);
}

export const adminAccessQuery = () =>
	orpc.adminAuth.myAccess.queryOptions({ input: undefined });

/**
 * The caller's staff access, for showing and hiding admin UI. The API checks
 * every call again, so this only decides what is worth rendering.
 */
export function useAdminAccess() {
	const q = useQuery({ ...adminAccessQuery(), staleTime: 60_000 });
	const perms = new Set(q.data?.permissions ?? []);
	return {
		...q,
		perms,
		can: (required: string) => permits(perms, required),
	};
}

/** True when a mutation failed only because step-up was dismissed. */
export function isStepUpCancelled(e: unknown): boolean {
	return e instanceof StepUpCancelled;
}

export class StepUpCancelled extends Error {
	constructor() {
		super("step-up cancelled");
		this.name = "StepUpCancelled";
	}
}

export function errorCode(e: unknown): string | undefined {
	if (e && typeof e === "object" && "code" in e) {
		const code = (e as { code: unknown }).code;
		return typeof code === "string" ? code : undefined;
	}
	return undefined;
}
