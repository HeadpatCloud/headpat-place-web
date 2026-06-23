import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
	Bold,
	Heading2,
	Heading3,
	ImageIcon,
	Italic,
	Link2,
	List,
	ListOrdered,
	Loader2,
	Minus,
	Quote,
	SquareMousePointer,
	Strikethrough,
	Table as TableIcon,
	Underline,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BACKEND_URL, client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

const BIO_IMAGE_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
const BIO_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const BIO_IMAGE_SRC =
	/^(?:https?:\/\/[^\s]*)?\/api\/files\/bio-image\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/;

// Only our own uploaded bio images are allowed — the server strips everything
// else on save, so rejecting foreign srcs here keeps the editor honest instead
// of showing images that would silently vanish.
const BioImage = Image.extend({
	addInputRules() {
		return [];
	},
	parseHTML() {
		return [
			{
				tag: "img[src]",
				getAttrs: (el) =>
					BIO_IMAGE_SRC.test((el as HTMLElement).getAttribute("src") ?? "")
						? null
						: false,
			},
		];
	},
});

// Link mark that can carry our CTA-button class (per-link, not global).
const CtaLink = Link.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			class: {
				default: null,
				parseHTML: (el) => el.getAttribute("class"),
				renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
			},
		};
	},
});

function TBtn({
	active,
	onClick,
	title,
	children,
}: {
	active?: boolean;
	onClick: () => void;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			title={title}
			aria-label={title}
			aria-pressed={active}
			// keep the editor selection while clicking the toolbar
			onMouseDown={(e) => e.preventDefault()}
			onClick={onClick}
			className={cn(
				"grid h-8 w-8 place-items-center rounded-md text-sm transition-colors",
				active
					? "bg-primary text-primary-foreground"
					: "text-foreground hover:bg-accent hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}

export function RichBioEditor({
	initialHtml,
	onChange,
	onUploadingChange,
	enableImages = true,
}: {
	initialHtml: string;
	onChange: (html: string) => void;
	onUploadingChange?: (uploading: boolean) => void;
	enableImages?: boolean;
}) {
	const [linkOpen, setLinkOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [linkCta, setLinkCta] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				link: false,
				code: false,
				codeBlock: false,
				heading: { levels: [2, 3] },
			}),
			CtaLink.configure({
				openOnClick: false,
				autolink: true,
				defaultProtocol: "https",
				HTMLAttributes: {
					rel: "noopener noreferrer nofollow",
					target: "_blank",
				},
			}),
			Table.configure({ resizable: false }),
			TableRow,
			TableHeader,
			TableCell,
			BioImage,
		],
		// saved bios store image paths relative to the API — make them absolute
		// so they display inside the editor
		content: (initialHtml || "").replace(
			/src="\/api\/files\//g,
			`src="${BACKEND_URL}/api/files/`,
		),
		editorProps: {
			attributes: { class: "rich-bio min-h-[180px] focus:outline-none" },
		},
		onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
	});

	const s = useEditorState({
		editor,
		selector: ({ editor }) =>
			editor
				? {
						bold: editor.isActive("bold"),
						italic: editor.isActive("italic"),
						underline: editor.isActive("underline"),
						strike: editor.isActive("strike"),
						h2: editor.isActive("heading", { level: 2 }),
						h3: editor.isActive("heading", { level: 3 }),
						bullet: editor.isActive("bulletList"),
						ordered: editor.isActive("orderedList"),
						quote: editor.isActive("blockquote"),
						link: editor.isActive("link"),
						inTable: editor.isActive("table"),
					}
				: null,
	});

	if (!editor) {
		return (
			<div className="h-48 rounded-xl border border-border bg-background animate-pulse" />
		);
	}

	const uploadImage = async (file: File) => {
		if (!BIO_IMAGE_ACCEPT.split(",").includes(file.type)) {
			toast.error("Only PNG, JPEG, GIF or WebP images are allowed.");
			return;
		}
		if (file.size > BIO_IMAGE_MAX_BYTES) {
			toast.error("Image is too large (max 8 MB).");
			return;
		}
		setUploading(true);
		onUploadingChange?.(true);
		try {
			const init = await client.profile.bioImageInit({
				contentType: file.type,
			});
			const put = await fetch(init.uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			});
			if (!put.ok) throw new Error(`Upload failed (${put.status})`);
			const fin = await client.profile.bioImageFinalize({
				fileId: init.fileId,
			});
			if (editor.isDestroyed) return;
			editor
				.chain()
				.focus()
				.setImage({ src: `${BACKEND_URL}${fin.publicPath}` })
				.run();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed.");
		} finally {
			setUploading(false);
			onUploadingChange?.(false);
		}
	};

	const openLink = (cta: boolean) => {
		const attrs = editor.getAttributes("link");
		setLinkUrl((attrs.href as string | undefined) ?? "https://");
		// editing an existing link keeps its CTA state instead of the clicked button's
		setLinkCta(editor.isActive("link") ? attrs.class === "bio-cta" : cta);
		setLinkOpen(true);
	};
	const applyLink = () => {
		const url = linkUrl.trim();
		// a bare scheme (the prefill) means the user didn't enter a URL
		if (!url || /^https?:\/\/$/i.test(url)) {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
		} else {
			const ok = editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: url, class: linkCta ? "bio-cta" : null })
				.run();
			if (!ok) {
				toast.error("That link isn't allowed.");
				return;
			}
		}
		setLinkOpen(false);
	};

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-background">
			<div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
				<TBtn
					title="Bold"
					active={s?.bold}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<Bold className="size-4" />
				</TBtn>
				<TBtn
					title="Italic"
					active={s?.italic}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<Italic className="size-4" />
				</TBtn>
				<TBtn
					title="Underline"
					active={s?.underline}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				>
					<Underline className="size-4" />
				</TBtn>
				<TBtn
					title="Strikethrough"
					active={s?.strike}
					onClick={() => editor.chain().focus().toggleStrike().run()}
				>
					<Strikethrough className="size-4" />
				</TBtn>
				<span className="mx-1 h-5 w-px bg-border" />
				<TBtn
					title="Heading"
					active={s?.h2}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
				>
					<Heading2 className="size-4" />
				</TBtn>
				<TBtn
					title="Subheading"
					active={s?.h3}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
				>
					<Heading3 className="size-4" />
				</TBtn>
				<TBtn
					title="Bullet list"
					active={s?.bullet}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<List className="size-4" />
				</TBtn>
				<TBtn
					title="Numbered list"
					active={s?.ordered}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<ListOrdered className="size-4" />
				</TBtn>
				<TBtn
					title="Quote"
					active={s?.quote}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
				>
					<Quote className="size-4" />
				</TBtn>
				<span className="mx-1 h-5 w-px bg-border" />
				<TBtn title="Link" active={s?.link} onClick={() => openLink(false)}>
					<Link2 className="size-4" />
				</TBtn>
				<TBtn title="Button" onClick={() => openLink(true)}>
					<SquareMousePointer className="size-4" />
				</TBtn>
				<TBtn
					title="Insert table"
					onClick={() =>
						editor
							.chain()
							.focus()
							.insertTable({ rows: 2, cols: 2, withHeaderRow: true })
							.run()
					}
				>
					<TableIcon className="size-4" />
				</TBtn>
				{enableImages ? (
					<TBtn
						title="Image"
						onClick={() => {
							if (uploading) return;
							setLinkOpen(false);
							fileInputRef.current?.click();
						}}
					>
						{uploading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<ImageIcon className="size-4" />
						)}
					</TBtn>
				) : null}
				<TBtn
					title="Divider"
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
				>
					<Minus className="size-4" />
				</TBtn>
				{enableImages ? (
					<input
						ref={fileInputRef}
						type="file"
						accept={BIO_IMAGE_ACCEPT}
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							e.target.value = "";
							if (file) uploadImage(file);
						}}
					/>
				) : null}
			</div>

			{s?.inTable ? (
				<div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 px-2 py-1.5 text-xs">
					<button
						type="button"
						className="rounded px-2 py-1 hover:bg-accent"
						onClick={() => editor.chain().focus().addColumnAfter().run()}
					>
						+ Column
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 hover:bg-accent"
						onClick={() => editor.chain().focus().addRowAfter().run()}
					>
						+ Row
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 hover:bg-accent"
						onClick={() => editor.chain().focus().deleteColumn().run()}
					>
						− Column
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 hover:bg-accent"
						onClick={() => editor.chain().focus().deleteRow().run()}
					>
						− Row
					</button>
					<button
						type="button"
						className="rounded px-2 py-1 text-destructive hover:bg-accent"
						onClick={() => editor.chain().focus().deleteTable().run()}
					>
						Delete table
					</button>
				</div>
			) : null}

			{linkOpen ? (
				<div className="flex items-center gap-2 border-b border-border bg-muted/40 px-2 py-2">
					<Input
						autoFocus
						value={linkUrl}
						onChange={(e) => setLinkUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								applyLink();
							} else if (e.key === "Escape") {
								setLinkOpen(false);
							}
						}}
						placeholder="https://…"
						className="h-8"
					/>
					<Button type="button" size="sm" onClick={applyLink}>
						{linkCta ? "Add button" : "Add link"}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => setLinkOpen(false)}
					>
						Cancel
					</Button>
				</div>
			) : null}

			<EditorContent
				editor={editor}
				className="max-h-[60vh] overflow-auto px-3 py-2"
			/>
		</div>
	);
}
