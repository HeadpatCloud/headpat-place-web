import {
	type DraggableAttributes,
	type DraggableSyntheticListeners,
	useDraggable,
} from "@dnd-kit/core";
import {
	FolderIcon,
	HeartHandshakeIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { StorageImage } from "@/components/StorageImage";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
	type RailIndicator,
	type RailRow,
	rowDataAttrs,
	rowKey,
} from "./rail-dnd";

export type RailServer = {
	id: string;
	name: string;
	slug: string;
	avatarFileId: string | null;
};

type IndicatorPos = RailIndicator["pos"] | null;

export function ServerTile({
	server,
	size = "full",
	className,
}: {
	server: RailServer | undefined;
	size?: "mini" | "full";
	className?: string;
}) {
	const dim = size === "mini" ? "size-4.5" : "size-11";
	const fallback = (
		<div
			className={cn(
				"flex items-center justify-center rounded-md bg-muted text-muted-foreground",
				dim,
				className,
			)}
		>
			<HeartHandshakeIcon className={size === "mini" ? "size-3" : "size-5"} />
		</div>
	);
	if (!server) return fallback;
	return (
		<StorageImage
			kind="community-avatar"
			fileId={server.avatarFileId}
			variant="sm"
			className={cn("rounded-md object-cover bg-muted", dim, className)}
			fallback={fallback}
		/>
	);
}

export function FolderTile({
	serverIds,
	servers,
	className,
}: {
	serverIds: string[];
	servers: RailServer[];
	className?: string;
}) {
	return (
		<div
			className={cn(
				"grid size-11 grid-cols-2 grid-rows-2 place-items-center gap-0.5 rounded-md bg-muted/60 p-1",
				className,
			)}
		>
			{serverIds.slice(0, 4).map((sid) => (
				<ServerTile
					key={sid}
					server={servers.find((s) => s.id === sid)}
					size="mini"
				/>
			))}
		</div>
	);
}

function DropLine({ pos }: { pos: "top" | "bottom" }) {
	return (
		<span
			aria-hidden
			className={cn(
				"pointer-events-none absolute left-1/2 z-10 h-[3px] w-14 -translate-x-1/2 rounded-full bg-primary",
				pos === "top" ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2",
			)}
		/>
	);
}

type SlotRender = {
	setNodeRef: (el: HTMLElement | null) => void;
	attributes: DraggableAttributes;
	listeners: DraggableSyntheticListeners;
	isDragging: boolean;
	combine: boolean;
};

/**
 * One rail row: a hit-test band (which includes half the gap above and
 * below, so the pointer is always over some row) around a draggable item.
 */
export function RailSlot({
	row,
	dragId,
	dragKind,
	indicator,
	flip = true,
	children,
}: {
	row: RailRow;
	dragId: string;
	dragKind: "server" | "folder";
	indicator: IndicatorPos;
	flip?: boolean;
	children: (slot: SlotRender) => ReactNode;
}) {
	const drag = useDraggable({ id: dragId, data: { kind: dragKind } });
	return (
		<div
			{...rowDataAttrs(row)}
			data-flip={flip ? dragId : undefined}
			className="relative flex w-full justify-center py-1"
		>
			{indicator === "top" || indicator === "bottom" ? (
				<DropLine pos={indicator} />
			) : null}
			{children({
				setNodeRef: drag.setNodeRef,
				attributes: drag.attributes,
				listeners: drag.listeners,
				isDragging: drag.isDragging,
				combine: indicator === "combine",
			})}
		</div>
	);
}

export function RailServerButton({
	server,
	active,
	slot,
	onSelect,
}: {
	server: RailServer | undefined;
	active: boolean;
	slot: SlotRender;
	onSelect: () => void;
}) {
	return (
		<button
			ref={slot.setNodeRef}
			type="button"
			onClick={onSelect}
			title={server?.name}
			aria-label={server?.name}
			{...slot.attributes}
			{...slot.listeners}
			className={cn(
				"rounded-md transition-[scale,opacity,box-shadow] duration-150 hover:scale-105",
				active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
				slot.combine &&
					"scale-90 ring-2 ring-primary ring-offset-4 ring-offset-card",
				slot.isDragging && "opacity-30",
			)}
		>
			<ServerTile server={server} />
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
	indicatorFor,
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
	indicatorFor: (key: string) => IndicatorPos;
	onToggle: (folderId: string) => void;
	onSelectServer: (serverId: string) => void;
	onRename: (folderId: string) => void;
	onRemove: (folderId: string) => void;
}) {
	const t = useTranslations("chatUi");
	const [menuOpen, setMenuOpen] = useState(false);
	const byId = (sid: string) => servers.find((s) => s.id === sid);
	const headerRow: RailRow = { type: "folder", id, expanded };

	return (
		<div
			className={cn(
				"flex w-14 flex-col items-center rounded-lg transition-colors duration-200",
				expanded && "bg-muted/60",
			)}
		>
			<RailSlot
				row={headerRow}
				dragId={id}
				dragKind="folder"
				indicator={indicatorFor(rowKey(headerRow))}
				flip={false}
			>
				{(slot) => (
					<DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
						<DropdownMenuTrigger asChild>
							<button
								ref={slot.setNodeRef}
								type="button"
								{...slot.attributes}
								{...slot.listeners}
								onPointerDown={(e) => {
									slot.listeners?.onPointerDown?.(e);
									// left click toggles; the menu opens on right click only
									e.preventDefault();
								}}
								onClick={() => onToggle(id)}
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
								aria-expanded={expanded}
								className={cn(
									"rounded-md transition-[scale,opacity,box-shadow] duration-150 hover:scale-105",
									slot.combine &&
										"scale-90 ring-2 ring-primary ring-offset-4 ring-offset-card",
									slot.isDragging && "opacity-30",
								)}
							>
								{expanded ? (
									<span className="flex size-11 items-center justify-center rounded-md text-link">
										<FolderIcon className="size-5" />
									</span>
								) : (
									<FolderTile serverIds={serverIds} servers={servers} />
								)}
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
				)}
			</RailSlot>

			<div
				className={cn(
					"grid w-full transition-[grid-template-rows] duration-200 ease-out",
					expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="min-h-0 overflow-hidden">
					<div className="pb-1">
						{serverIds.map((sid) => {
							const row: RailRow = { type: "child", id: sid, folderId: id };
							return (
								<RailSlot
									key={sid}
									row={row}
									dragId={sid}
									dragKind="server"
									indicator={indicatorFor(rowKey(row))}
								>
									{(slot) => (
										<RailServerButton
											server={byId(sid)}
											active={sid === activeServerId}
											slot={slot}
											onSelect={() => onSelectServer(sid)}
										/>
									)}
								</RailSlot>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
