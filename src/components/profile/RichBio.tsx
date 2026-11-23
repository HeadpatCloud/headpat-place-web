import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MentionChip } from "@/components/UserText";
import { useMentionUsers } from "@/hooks/use-mention-users";
import { parseMentions, profileLinkHandle } from "@/lib/mentions";
import { BACKEND_URL } from "@/lib/orpc";
import { cn } from "@/lib/utils";

type MentionSlot = {
	el: HTMLElement;
	handle: string;
	text: string;
	// Set when the slot replaced a link, so an unknown user stays a link.
	link?: { href: string; target: string | null; rel: string | null };
	// What the slot replaced, put back on cleanup.
	original: Node;
};

// Elements whose text is never turned into a chip.
const SKIP_INSIDE = "a, code, pre";

/** Swaps @name text and bare profile links inside rendered HTML for empty
 *  slots, which React then fills with a chip or the original text. Built with
 *  DOM calls only (no HTML strings), so user text is never parsed as markup. */
function mountMentionSlots(root: HTMLElement): MentionSlot[] {
	const slots: MentionSlot[] = [];
	const makeSlot = (
		handle: string,
		text: string,
		original: Node,
		link?: MentionSlot["link"],
	) => {
		const el = document.createElement("span");
		el.className = "mention-slot";
		slots.push({ el, handle, text, link, original });
		return el;
	};

	// Links the editor made from a pasted profile URL, or that read "@name".
	for (const a of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
		if (a.classList.contains("bio-cta")) continue;
		const href = a.getAttribute("href") ?? "";
		const handle = profileLinkHandle(href);
		if (!handle) continue;
		const label = (a.textContent ?? "").trim();
		const bare = label.replace(/^https?:\/\//i, "").replace(/\/$/, "");
		const hrefBare = href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
		if (label === `@${handle}` || bare === hrefBare) {
			a.replaceWith(
				makeSlot(handle, a.textContent ?? "", a, {
					href,
					target: a.getAttribute("target"),
					rel: a.getAttribute("rel"),
				}),
			);
		}
	}

	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	for (let n = walker.nextNode(); n; n = walker.nextNode()) {
		const t = n as Text;
		if (t.parentElement?.closest(SKIP_INSIDE)) continue;
		if (t.data.includes("@") || t.data.includes("/user/")) textNodes.push(t);
	}
	for (const node of textNodes) {
		const parts = parseMentions(node.data);
		if (!parts.some((p) => p.kind === "mention")) continue;
		const replacement = document.createDocumentFragment();
		for (const part of parts) {
			replacement.append(
				part.kind === "mention"
					? makeSlot(part.handle, part.text, document.createTextNode(part.text))
					: document.createTextNode(part.text),
			);
		}
		node.replaceWith(replacement);
	}
	return slots;
}

// Renders a profile's rich bio. `html` is already sanitized server-side on save
// (strict allow-list in the API), so it's safe to inject; we only wrap tables so
// they scroll on small screens and point stored image paths at the API origin.
// The replaces are anchored on `<` so they only match sanitizer-emitted markup —
// a literal `<` in user text is entity-escaped by then. Mentions become user
// chips after mount, so the server render stays plain.
export function RichBio({
	html,
	className,
}: {
	html: string;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [slots, setSlots] = useState<MentionSlot[]>([]);
	const wrapped = useMemo(
		() =>
			html
				.replace(/<table/g, '<div class="rich-bio-scroll"><table')
				.replace(/<\/table>/g, "</table></div>")
				.replace(
					/<img src="\/api\/files\//g,
					`<img src="${BACKEND_URL}/api/files/`,
				),
		[html],
	);

	// A stable object: React rewrites innerHTML whenever this prop changes
	// identity, which would throw away the mention slots on every re-render.
	const inner = useMemo(() => ({ __html: wrapped }), [wrapped]);

	useEffect(() => {
		const root = ref.current;
		if (!root || !(wrapped.includes("@") || wrapped.includes("/user/"))) {
			setSlots([]);
			return;
		}
		const mounted = mountMentionSlots(root);
		setSlots(mounted);
		// Undo the DOM changes so a re-run (Strict Mode, new html) starts from
		// the markup React rendered.
		return () => {
			for (const slot of mounted) slot.el.replaceWith(slot.original);
			root.normalize();
		};
	}, [wrapped]);

	const handles = useMemo(
		() => [...new Set(slots.map((s) => s.handle))],
		[slots],
	);
	const users = useMentionUsers(handles);

	return (
		<>
			<div
				ref={ref}
				className={cn("rich-bio", className)}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: server-sanitized bioHtml (allow-listed tags only)
				dangerouslySetInnerHTML={inner}
			/>
			{slots.map((slot, i) => {
				const user = users.get(slot.handle);
				const fallback = slot.link ? (
					<a
						href={slot.link.href}
						target={slot.link.target ?? undefined}
						rel={slot.link.rel ?? undefined}
					>
						{slot.text}
					</a>
				) : (
					slot.text
				);
				return createPortal(
					user ? <MentionChip user={user} /> : fallback,
					slot.el,
					`mention-${i}`,
				);
			})}
		</>
	);
}
