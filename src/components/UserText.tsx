import { Link } from "@tanstack/react-router";
import { Fragment, useMemo } from "react";
import { StorageImage } from "@/components/StorageImage";
import { type MentionUser, useMentionUsers } from "@/hooks/use-mention-users";
import { mentionHandles, parseMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";

function initial(user: MentionUser): string {
	return (user.displayName || user.name || user.profileUrl)
		.trim()
		.charAt(0)
		.toUpperCase();
}

/** A mentioned user drawn inline: small avatar and display name, linking to
 *  their profile. */
export function MentionChip({
	user,
	className,
}: {
	user: MentionUser;
	className?: string;
}) {
	const label = user.displayName || user.name || user.profileUrl;
	return (
		<Link
			to={`/user/${user.profileUrl}` as never}
			title={`@${user.profileUrl}`}
			className={cn(
				"mention-chip inline-flex max-w-full items-center gap-1 rounded-full bg-primary/15 py-px pr-2 pl-px align-bottom font-semibold leading-snug text-link no-underline transition-colors hover:bg-primary/25 focus-visible:outline-2 focus-visible:outline-ring",
				className,
			)}
		>
			<StorageImage
				kind="avatar"
				fileId={user.avatarFileId}
				variant="sm"
				className="size-[1.3em] shrink-0 rounded-full bg-muted object-cover"
				fallback={
					<span
						aria-hidden
						className="flex size-[1.3em] shrink-0 items-center justify-center rounded-full bg-muted text-[0.7em] text-foreground leading-none"
					>
						{initial(user)}
					</span>
				}
			/>
			<span className="truncate">{label}</span>
		</Link>
	);
}

/** User-written plain text with @name mentions and profile links shown as
 *  user chips. Names that don't belong to a visible user stay as typed. */
export function UserText({ text }: { text: string | null | undefined }) {
	const parts = useMemo(() => parseMentions(text ?? ""), [text]);
	const handles = useMemo(() => mentionHandles(parts), [parts]);
	const users = useMentionUsers(handles);
	if (handles.length === 0) return <>{text}</>;
	return (
		<>
			{parts.map((part, i) => {
				const user = part.kind === "mention" ? users.get(part.handle) : null;
				return user ? (
					<MentionChip key={i} user={user} />
				) : (
					<Fragment key={i}>{part.text}</Fragment>
				);
			})}
		</>
	);
}
