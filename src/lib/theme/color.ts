// Resolve any CSS color string to "#rrggbb" using the browser. "#000000" on the server.
export function cssColorToHex(input: string): string {
	if (typeof document === "undefined") return "#000000";
	const probe = document.createElement("span");
	probe.style.color = input;
	probe.style.display = "none";
	document.body.appendChild(probe);
	const resolved = getComputedStyle(probe).color;
	probe.remove();
	const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(resolved);
	if (!m) return "#000000";
	const hex = (n: string) => Number(n).toString(16).padStart(2, "0");
	return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
}

// Read the currently-applied value of a theme token from :root as hex.
export function readActiveToken(key: string): string {
	if (typeof document === "undefined") return "#000000";
	const raw = getComputedStyle(document.documentElement)
		.getPropertyValue(`--${key}`)
		.trim();
	return raw ? cssColorToHex(raw) : "#000000";
}
