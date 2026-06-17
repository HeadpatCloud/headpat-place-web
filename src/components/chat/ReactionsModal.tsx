import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import {
	buildAllReactors,
	type ReactorUser,
	shouldShowAllTab,
} from "@/components/chat/reactor-summary";
import { StorageImage } from "@/components/StorageImage";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	messageId: string;
	initialEmoji: string | null;
};

const ALL = "__all__";

const nameOf = (u: ReactorUser) =>
	u.displayName || u.name || u.profileUrl || u.userId.slice(0, 8);

function initials(name: string): string {
	return (name.trim().charAt(0) || "?").toUpperCase();
}

function ReactorRow({
	user,
	onNavigate,
	trailing,
}: {
	user: ReactorUser;
	onNavigate: () => void;
	trailing?: ReactNode;
}) {
	const name = nameOf(user);
	return (
		<LocalizedLink
			to={`/user/${user.profileUrl}`}
			onClick={onNavigate}
			className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
		>
			<StorageImage
				kind="avatar"
				fileId={user.avatarFileId}
				variant="sm"
				className="size-7 rounded-full object-cover bg-muted"
				fallback={
					<div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
						{initials(name)}
					</div>
				}
			/>
			<span className="min-w-0 flex-1 truncate">{name}</span>
			{trailing ? (
				<span className="shrink-0 text-sm leading-none">{trailing}</span>
			) : null}
		</LocalizedLink>
	);
}

export function ReactionsModal({
	open,
	onOpenChange,
	messageId,
	initialEmoji,
}: Props) {
	const t = useTranslations("chatUi");
	const [selected, setSelected] = useState<string | null>(initialEmoji);

	useEffect(() => {
		if (open) setSelected(initialEmoji);
	}, [open, initialEmoji]);

	const reactorsQ = useQuery({
		...orpc.message.reactors.queryOptions({ input: { messageId } }),
		enabled: open,
	});

	const groups = reactorsQ.data?.reactions ?? [];
	const showAll = shouldShowAllTab(groups);
	const active = selected ?? (showAll ? ALL : groups[0]?.emoji) ?? null;

	const allReactors = buildAllReactors(groups);
	const selectedGroup =
		active === ALL ? null : groups.find((g) => g.emoji === active);

	const close = () => onOpenChange(false);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg gap-0 p-0">
				<DialogHeader className="border-b border-border px-4 py-3">
					<DialogTitle>{t("reactionsTitle")}</DialogTitle>
				</DialogHeader>
				<div className="flex h-80">
					<div className="w-32 shrink-0 overflow-y-auto border-r border-border p-2">
						{showAll ? (
							<button
								type="button"
								onClick={() => setSelected(ALL)}
								className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
									active === ALL
										? "bg-primary/15 text-foreground"
										: "text-muted-foreground hover:bg-muted"
								}`}
							>
								<span className="flex-1 text-left">{t("allReactions")}</span>
								<span className="tabular-nums">{allReactors.length}</span>
							</button>
						) : null}
						{groups.map((g) => (
							<button
								key={g.emoji}
								type="button"
								onClick={() => setSelected(g.emoji)}
								className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
									active === g.emoji
										? "bg-primary/15 text-foreground"
										: "text-muted-foreground hover:bg-muted"
								}`}
							>
								<span className="text-base leading-none">{g.emoji}</span>
								<span className="flex-1 text-left tabular-nums">{g.count}</span>
							</button>
						))}
					</div>
					<ScrollArea className="flex-1">
						<div className="p-2">
							{active === ALL
								? allReactors.map(({ user, emojis }) => (
										<ReactorRow
											key={user.userId}
											user={user}
											onNavigate={close}
											trailing={emojis.join(" ")}
										/>
									))
								: selectedGroup
									? [
											...selectedGroup.users.map((u) => (
												<ReactorRow
													key={u.userId}
													user={u}
													onNavigate={close}
												/>
											)),
											selectedGroup.count > selectedGroup.users.length ? (
												<p
													key="more"
													className="px-2 py-1.5 text-xs text-muted-foreground"
												>
													{t("moreReacted", {
														count:
															selectedGroup.count - selectedGroup.users.length,
													})}
												</p>
											) : null,
										]
									: null}
						</div>
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
