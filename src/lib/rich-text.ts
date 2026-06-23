// Stored rich content (bios, announcements) may be HTML from the rich editor or
// legacy plain text. Normalize for rendering/editing and derive plain previews.

export function ensureHtml(value: string): string {
	if (!value) return "";
	if (/<[a-z][\s\S]*>/i.test(value)) return value;
	const esc = value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	return `<p>${esc.replace(/\n/g, "<br>")}</p>`;
}

export function htmlToText(value: string): string {
	return value
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/\s+/g, " ")
		.trim();
}
