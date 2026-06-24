import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HeartHandshakeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { StorageImage } from "@/components/StorageImage";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type RailServer = {
	id: string;
	name: string;
	slug: string;
	avatarFileId: string | null;
};

function ServerIcon({
	server,
	size,
	active,
	onClick,
}: {
	server: RailServer | undefined;
	size: "mini" | "full";
	active?: boolean;
	onClick?: () => void;
}) {
	const dim = size === "mini" ? "size-4.5" : "size-11";
	const fallback = (
		<div
			className={cn(
				"flex items-center justify-center rounded-md bg-muted text-muted-foreground",
				dim,
			)}
		>
			<HeartHandshakeIcon className={size === "mini" ? "size-3" : "size-5"} />
		</div>
	);
	if (!server) return fallback;
	const img = (
		<StorageImage
			kind="community-avatar"
			fileId={server.avatarFileId}
			variant="sm"
			className={cn("rounded-md object-cover bg-muted", dim)}
			fallback={fallback}
		/>
	);
	if (!onClick) return img;
	return (
		<button
			type="button"
			onClick={onClick}
			title={server.name}
			aria-label={server.name}
			className={cn(
				"rounded-md transition-transform hover:scale-105",
				active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
			)}
		>
			{img}
		</button>
	);
}

function SortableFolderServer({
	server,
	active,
	onClick,
}: {
	server: RailServer | undefined;
	active: boolean;
	onClick: () => void;
}) {
	const id = server?.id ?? "";
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	return (
		<button
			ref={setNodeRef}
			type="button"
			onClick={onClick}
			title={server?.name}
			aria-label={server?.name}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"rounded-md transition-transform hover:scale-105",
				active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
				isDragging && "opacity-50",
			)}
			{...attributes}
			{...listeners}
		>
			<StorageImage
				kind="community-avatar"
				fileId={server?.avatarFileId}
				variant="sm"
				className="size-11 rounded-md object-cover bg-muted"
				fallback={
					<div className="flex size-11 items-center justify-center rounded-md bg-muted text-muted-foreground">
						<HeartHandshakeIcon className="size-5" />
					</div>
				}
			/>
		</button>
	);
}

export function ServerFolder({
	id,
	name,
	serverIds,
	servers,
	expanded,
	activeServerId,
	onToggle,
	onSelectServer,
	onRename,
	onRemove,
}: {
	id: string;
	name: string;
	serverIds: string[];
	servers: RailServer[];
	expanded: boolean;
	activeServerId: string | null;
	onToggle: (folderId: string) => void;
	onSelectServer: (serverId: string) => void;
	onRename: (folderId: string) => void;
	onRemove: (folderId: string) => void;
}) {
	const t = useTranslations("chatUi");
	const [menuOpen, setMenuOpen] = useState(false);
	const { setNodeRef, isOver } = useDroppable({ id });
	const byId = (sid: string) => servers.find((s) => s.id === sid);

	return (
		<div ref={setNodeRef} className="flex flex-col items-center">
			<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						onClick={() => onToggle(id)}
						onPointerDown={(e) => e.preventDefault()}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onToggle(id);
							}
						}}
						onContextMenu={(e) => {
							e.preventDefault();
							setMenuOpen(true);
						}}
						title={name}
						aria-label={name}
						className={cn(
							"grid size-11 grid-cols-2 grid-rows-2 place-items-center gap-0.5 rounded-md bg-muted/60 p-1 transition-colors hover:bg-muted",
							expanded && "bg-muted",
							isOver && "ring-2 ring-emerald-500",
						)}
					>
						{serverIds.slice(0, 4).map((sid) => (
							<ServerIcon key={sid} server={byId(sid)} size="mini" />
						))}
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="right" align="start">
					<DropdownMenuItem onSelect={() => onRename(id)}>
						<PencilIcon className="size-4" />
						{t("renameFolder")}
					</DropdownMenuItem>
					<DropdownMenuItem
						className="text-destructive focus:text-destructive"
						onSelect={() => onRemove(id)}
					>
						<Trash2Icon className="size-4" />
						{t("removeFolder")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{expanded ? (
				<div className="mt-1 flex flex-col items-center gap-1.5 rounded-md bg-muted/40 p-1.5">
					<SortableContext
						items={serverIds}
						strategy={verticalListSortingStrategy}
					>
						{serverIds.map((sid) => (
							<SortableFolderServer
								key={sid}
								server={byId(sid)}
								active={sid === activeServerId}
								onClick={() => onSelectServer(sid)}
							/>
						))}
					</SortableContext>
				</div>
			) : null}
		</div>
	);
}
