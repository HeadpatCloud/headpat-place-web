import { BACKEND_URL } from "@/lib/orpc";
import { cn } from "@/lib/utils";

// Renders a profile's rich bio. `html` is already sanitized server-side on save
// (strict allow-list in the API), so it's safe to inject; we only wrap tables so
// they scroll on small screens and point stored image paths at the API origin.
// The replaces are anchored on `<` so they only match sanitizer-emitted markup —
// a literal `<` in user text is entity-escaped by then.
export function RichBio({
	html,
	className,
}: {
	html: string;
	className?: string;
}) {
	const wrapped = html
		.replace(/<table/g, '<div class="rich-bio-scroll"><table')
		.replace(/<\/table>/g, "</table></div>")
		.replace(
			/<img src="\/api\/files\//g,
			`<img src="${BACKEND_URL}/api/files/`,
		);
	return (
		<div
			className={cn("rich-bio", className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: server-sanitized bioHtml (allow-listed tags only)
			dangerouslySetInnerHTML={{ __html: wrapped }}
		/>
	);
}
