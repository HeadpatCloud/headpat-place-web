export function isNotFoundError(error: unknown): boolean {
	return (error as { code?: string } | null | undefined)?.code === "NOT_FOUND";
}

/** A 404 is a real answer — retrying it only delays the message. Everything else
 *  (cold starts, blips, 5xx) is worth another go before we tell the user the
 *  thing doesn't exist. */
export function retryUnlessNotFound(failureCount: number, error: unknown) {
	if (isNotFoundError(error)) return false;
	return failureCount < 3;
}
