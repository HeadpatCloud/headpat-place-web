import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { PlusIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusDot } from "@/components/StatusDot";
import { StorageImage } from "@/components/StorageImage";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { NewConversationDialog } from "./NewConversationDialog";

function initials(name: string | null | undefined, fallback: string): string {
	const source = name?.trim() || fallback;
	return source.charAt(0).toUpperCase();
}

export function MessagesPanel() {
	const t = useTranslations("chatUi");
	const location = useLocation();
	const [composing, setComposing] = useState(false);

	const activeConversationId = useMemo(() => {
		const m = location.pathname.match(/\/chat\/dm\/([^/]+)/);
		return m ? m[1] : null;
	}, [location.pathname]);

	const conversations = useQuery(
		orpc.message.myConversations.queryOptions({
			input: { page: 1, pageSize: 30 },
		}),
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex h-13 shrink-0 items-center gap-2 border-b border-border px-3.5">
				<span className="flex-1 text-sm font-semibold text-foreground">
					{t("messagesHeading")}
				</span>
				<button
					type="button"
					onClick={() => setComposing(true)}
					className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label={t("newMessage")}
				>
					<PlusIcon className="size-4" />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-2 py-2">
				{conversations.data?.items.map((c) => {
					const isGroup = c.others.length > 1;
					const other = c.others[0];
					const label = c.name
						? c.name
						: isGroup
							? c.others.map((o) => o.displayName || o.name || "?").join(", ")
							: other?.displayName || other?.name || t("conversationFallback");
					const isActive = c.id === activeConversationId;
					return (
						<Link
							key={c.id}
							to={`/chat/dm/${c.id}` as never}
							className={`relative flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors ${
								isActive
									? "bg-primary/15 text-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						>
							<span className="relative shrink-0">
								{isGroup ? (
									<div className="flex size-6.5 items-center justify-center rounded-full bg-muted text-muted-foreground">
										<UsersIcon className="size-3.5" />
									</div>
								) : (
									<>
										<StorageImage
											kind="avatar"
											fileId={other?.avatarFileId}
											variant="sm"
											className="size-6.5 rounded-full object-cover bg-muted"
											fallback={
												<div className="flex size-6.5 items-center justify-center rounded-full bg-muted text-xs font-semibold leading-none">
													{initials(label, "?")}
												</div>
											}
										/>
										{other ? (
											<StatusDot
												userId={other.userId}
												className="absolute -bottom-0.5 -right-0.5 border-background"
											/>
										) : null}
									</>
								)}
							</span>
							<span className="flex-1 truncate text-sm font-semibold text-foreground">
								{label}
							</span>
						</Link>
					);
				})}
			</div>

			<NewConversationDialog open={composing} onOpenChange={setComposing} />
		</div>
	);
}
