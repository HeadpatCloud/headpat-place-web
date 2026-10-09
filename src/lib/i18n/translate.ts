type Messages = { [key: string]: string | Messages };
export type TranslateOptions = Record<string, unknown>;

function lookup(
	messages: Messages,
	key: string,
): string | Messages | undefined {
	let node: string | Messages | undefined = messages;
	for (const part of key.split(".")) {
		if (node && typeof node === "object" && part in node) node = node[part];
		else return undefined;
	}
	return node;
}

function pluralize(node: Messages, count: unknown): string | undefined {
	const form =
		count === 0 && "zero" in node ? "zero" : count === 1 ? "one" : "other";
	const value = node[form];
	return typeof value === "string" ? value : undefined;
}

function interpolate(text: string, options: TranslateOptions): string {
	return text.replace(/%\{(\w+)\}/g, (_, name: string) =>
		name in options ? String(options[name]) : `[missing "%{${name}}" value]`,
	);
}

/** Resolves `key` against each message set in order, so the first one that has
 *  it wins (locale first, then English). */
export function translateFrom(
	chain: Messages[],
	key: string,
	options: TranslateOptions = {},
): string | undefined {
	for (const messages of chain) {
		const node = lookup(messages, key);
		if (node === undefined) continue;
		const text =
			typeof node === "string"
				? node
				: "count" in options
					? pluralize(node, options.count)
					: undefined;
		if (text !== undefined) return interpolate(text, options);
	}
	return undefined;
}
