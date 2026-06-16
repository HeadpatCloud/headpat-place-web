import {
	type CollisionDetection,
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	pointerWithin,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartHandshakeIcon, MessageSquareIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { StorageImage } from "@/components/StorageImage";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { type RailServer, ServerFolder } from "./ServerFolder";
import { applyDragResult, type ChatLayout } from "./sidebar-layout";

const MERGE = "merge:";

function SortableServerIcon({
	server,
	active,
	onSelect,
}: {
	server: RailServer | undefined;
	active: boolean;
	onSelect: () => void;
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
	// centered drop zone: hovering it combines into a folder, edges reorder.
	const merge = useDroppable({ id: `${MERGE}${id}` });
	return (
		<button
			ref={setNodeRef}
			type="button"
			onClick={onSelect}
			title={server?.name}
			aria-label={server?.name}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(
				"relative rounded-md transition-transform hover:scale-105",
				active && "ring-2 ring-primary ring-offset-1 ring-offset-background",
				merge.isOver && "ring-2 ring-emerald-500 ring-offset-1",
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
			<span
				ref={merge.setNodeRef}
				aria-hidden
				className="pointer-events-none absolute inset-2 rounded-md"
			/>
		</button>
	);
}

export function ServerRail({
	view,
	onSelectMessages,
	onSelectServer,
}: {
	view: "messages" | { serverId: string };
	onSelectMessages: () => void;
	onSelectServer: (serverId: string) => void;
}) {
	const t = useTranslations("chatUi");
	const qc = useQueryClient();
	const layoutQuery = useQuery(
		orpc.sidebarLayout.get.queryOptions({ input: undefined }),
	);
	const servers: RailServer[] = useMemo(
		() => layoutQuery.data?.servers ?? [],
		[layoutQuery.data?.servers],
	);

	const [layout, setLayout] = useState<ChatLayout>({ items: [] });
	const [expanded, setExpanded] = useState<string | null>(null);
	useEffect(() => {
		if (layoutQuery.data) setLayout({ items: layoutQuery.data.items });
	}, [layoutQuery.data]);

	const save = useMutation({
		mutationFn: (items: ChatLayout["items"]) =>
			client.sidebarLayout.save({ items }),
		onSuccess: () =>
			qc.invalidateQueries({ queryKey: orpc.sidebarLayout.get.queryKey() }),
		onError: (e: Error) => {
			toast.error(e.message);
			// roll the rail back to the last server-confirmed layout
			qc.invalidateQueries({ queryKey: orpc.sidebarLayout.get.queryKey() });
		},
	});

	const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const queueSave = (next: ChatLayout) => {
		clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => save.mutate(next.items), 500);
	};
	useEffect(() => () => clearTimeout(saveTimer.current), []);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const folderIds = useMemo(
		() =>
			new Set(layout.items.filter((i) => i.type === "folder").map((i) => i.id)),
		[layout.items],
	);

	// prefer a combine target (centered server merge-zone or a folder) under the
	// pointer; otherwise fall back to the closest sortable server for reordering.
	const collision: CollisionDetection = useCallback(
		(args) => {
			const isCombine = (id: string) =>
				id.startsWith(MERGE) || folderIds.has(id);
			const within = pointerWithin(args).filter((c) => isCombine(String(c.id)));
			if (within.length > 0) return [within[0]];
			return closestCenter(args).filter((c) => !isCombine(String(c.id)));
		},
		[folderIds],
	);

	const onDragEnd = (e: DragEndEvent) => {
		const activeId = String(e.active.id);
		const raw = e.over ? String(e.over.id) : null;
		if (!raw) return;
		const intoFolder = raw.startsWith(MERGE);
		const overId = intoFolder ? raw.slice(MERGE.length) : raw;
		if (activeId === overId) return;
		const next = applyDragResult(layout, activeId, overId, {
			makeFolderName: t("newFolder"),
			intoFolder,
		});
		setLayout(next);
		queueSave(next);
	};

	const activeServerId = view === "messages" ? null : view.serverId;
	// only top-level servers are sortable; folders are droppable but not dragged.
	const sortableIds = layout.items
		.filter((i) => i.type === "server")
		.map((i) => i.id);

	return (
		<div className="flex h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-3">
			<button
				type="button"
				onClick={onSelectMessages}
				aria-label={t("messagesHeading")}
				className={cn(
					"flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
					view === "messages" && "bg-primary/15 text-foreground",
				)}
			>
				<MessageSquareIcon className="size-5" />
			</button>

			<div className="h-px w-8 shrink-0 bg-border" />

			<div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
				<DndContext
					sensors={sensors}
					collisionDetection={collision}
					onDragEnd={onDragEnd}
				>
					<SortableContext
						items={sortableIds}
						strategy={verticalListSortingStrategy}
					>
						{layout.items.map((item) =>
							item.type === "server" ? (
								<SortableServerIcon
									key={item.id}
									server={servers.find((s) => s.id === item.id)}
									active={item.id === activeServerId}
									onSelect={() => onSelectServer(item.id)}
								/>
							) : (
								<ServerFolder
									key={item.id}
									id={item.id}
									name={item.name}
									serverIds={item.serverIds}
									servers={servers}
									expanded={expanded === item.id}
									activeServerId={activeServerId}
									onToggle={(fid) =>
										setExpanded((cur) => (cur === fid ? null : fid))
									}
									onSelectServer={onSelectServer}
									onRename={(fid) => {
										const folder = layout.items.find(
											(i) => i.type === "folder" && i.id === fid,
										);
										const cur = folder?.type === "folder" ? folder.name : "";
										const name = window.prompt(t("renameFolder"), cur);
										if (name == null) return;
										const trimmed = name.trim().slice(0, 64);
										if (!trimmed) return;
										const next: ChatLayout = {
											items: layout.items.map((i) =>
												i.type === "folder" && i.id === fid
													? { ...i, name: trimmed }
													: i,
											),
										};
										setLayout(next);
										queueSave(next);
									}}
									onRemove={(fid) => {
										const folder = layout.items.find(
											(i) => i.type === "folder" && i.id === fid,
										);
										const freed =
											folder?.type === "folder" ? folder.serverIds : [];
										const next: ChatLayout = {
											items: [
												...layout.items.filter(
													(i) => !(i.type === "folder" && i.id === fid),
												),
												...freed.map((sid) => ({
													type: "server" as const,
													id: sid,
												})),
											],
										};
										setLayout(next);
										queueSave(next);
									}}
								/>
							),
						)}
					</SortableContext>
				</DndContext>
			</div>
		</div>
	);
}
