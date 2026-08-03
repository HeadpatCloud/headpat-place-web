const NETWORK_FAILURE_MESSAGES = [
	"Couldn't reach the server. It might be napping - try again in a sec.",
	"The server isn't answering. Maybe it wandered off chasing a laser pointer.",
	"We lost the server somewhere. Give it another shot?",
	"No response from our end. The hamster running the servers needs a snack.",
	"The connection dropped. The server is probably hiding under the bed.",
	"Couldn't talk to the server - it left us on read. Try again?",
	"The server's being shy right now. One more try might coax it out.",
	"The internet gremlins ate that request. Please try again.",
	"Our server stepped out for head pats. Try again in a moment.",
	"Connection failed. Have you tried turning the vibes off and on again?",
];

const NETWORK_FAILURE_RE =
	/failed to fetch|networkerror|network request failed|fetch failed|load failed|err_connection|connection refused|the internet connection appears to be offline/i;

export function isNetworkFailure(message: string | null | undefined): boolean {
	return !!message && NETWORK_FAILURE_RE.test(message);
}

export function randomNetworkFailureMessage(): string {
	const i = Math.floor(Math.random() * NETWORK_FAILURE_MESSAGES.length);
	return NETWORK_FAILURE_MESSAGES[i];
}

// Turn a raw error message into something user-facing: a random, friendly line
// when the API is unreachable, otherwise the original message untouched.
export function humanizeError(message: string | null | undefined): string {
	if (isNetworkFailure(message)) return randomNetworkFailureMessage();
	return message ?? "Something went wrong. Please try again.";
}
