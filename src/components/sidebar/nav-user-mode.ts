export type NavUserMode = "loading" | "signed-out" | "signed-in";

/** Pending outranks signed-out: `current` is null until the session resolves, so
 *  treating that as signed-out flashes a login button at signed-in users. */
export function navUserMode(opts: {
	isPending: boolean;
	signedIn: boolean;
}): NavUserMode {
	if (opts.isPending) return "loading";
	return opts.signedIn ? "signed-in" : "signed-out";
}
