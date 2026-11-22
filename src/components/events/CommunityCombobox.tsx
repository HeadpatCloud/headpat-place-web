import {
	CheckIcon,
	ChevronsUpDownIcon,
	HeartHandshakeIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StorageImage } from "@/components/StorageImage";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CommunityOption = {
	id: string;
	name: string;
	avatarFileId?: string | null;
};

// Rendering every option (and fetching every avatar) gets slow for people in
// 100+ communities, so only the best matches are shown; typing narrows it.
const MAX_SHOWN = 50;

function CommunityAvatar({
	community,
	className,
}: {
	community: CommunityOption | undefined;
	className?: string;
}) {
	const fallback = (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
				className,
			)}
		>
			<HeartHandshakeIcon className="size-3.5" />
		</span>
	);
	return (
		<StorageImage
			kind="community-avatar"
			fileId={community?.avatarFileId}
			variant="sm"
			className={cn("shrink-0 rounded-md object-cover bg-muted", className)}
			fallback={fallback}
		/>
	);
}

/** Ranks prefix matches first, then word starts, then anywhere. */
function rank(name: string, query: string): number {
	const n = name.toLowerCase();
	if (n.startsWith(query)) return 0;
	if (n.split(/\s+/).some((w) => w.startsWith(query))) return 1;
	return n.includes(query) ? 2 : -1;
}

export function CommunityCombobox({
	id,
	value,
	options,
	loading,
	onChange,
}: {
	id?: string;
	value: string;
	options: CommunityOption[];
	loading?: boolean;
	onChange: (communityId: string) => void;
}) {
	const t = useTranslations("eventsPages");
	const c = useTranslations("common");
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const selected = options.find((o) => o.id === value);

	const matches = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return options;
		return options
			.map((o) => ({ o, r: rank(o.name, q) }))
			.filter((m) => m.r >= 0)
			.sort((a, b) => a.r - b.r || a.o.name.localeCompare(b.o.name))
			.map((m) => m.o);
	}, [options, query]);
	const shown = matches.slice(0, MAX_SHOWN);

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) setQuery("");
			}}
		>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between gap-2 px-3 font-normal"
				>
					{selected ? (
						<span className="flex min-w-0 items-center gap-2">
							<CommunityAvatar community={selected} className="size-6" />
							<span className="truncate">{selected.name}</span>
						</span>
					) : (
						<span className="truncate text-muted-foreground">
							{loading ? c("loading") : t("communityPlaceholder")}
						</span>
					)}
					<ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-(--radix-popover-trigger-width) min-w-64 p-0"
				align="start"
			>
				<Command shouldFilter={false}>
					<CommandInput
						value={query}
						onValueChange={setQuery}
						placeholder={t("communitySearch")}
					/>
					<CommandList className="max-h-72">
						<CommandEmpty>{t("noCommunityFound")}</CommandEmpty>
						<CommandGroup>
							{shown.map((o) => (
								<CommandItem
									key={o.id}
									value={o.id}
									onSelect={() => {
										onChange(o.id);
										setOpen(false);
										setQuery("");
									}}
									className="gap-2.5"
								>
									<CommunityAvatar community={o} className="size-7" />
									<span className="min-w-0 flex-1 truncate">{o.name}</span>
									<CheckIcon
										className={cn(
											"size-4 shrink-0 text-primary",
											o.id === value ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
						{matches.length > shown.length ? (
							<p className="px-3 py-2 text-center text-xs text-muted-foreground">
								{t("communityMoreHint", {
									shown: String(shown.length),
									total: String(matches.length),
								})}
							</p>
						) : null}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
