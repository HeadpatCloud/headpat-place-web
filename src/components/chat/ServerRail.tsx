import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareIcon } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import {
	isNoopDrop,
	type RailRow,
	type RailTarget,
	readRowAttrs,
	resolveRailTarget,
	rowDataAttrs,
	rowKey,
} from "./rail-dnd";
import {
	FolderTile,
	type RailServer,
	RailServerButton,
	RailSlot,
	ServerFolder,
	ServerTile,
} from "./ServerFolder";
import { applyDrop, type ChatLayout } from "./sidebar-layout";

type ActiveDrag = { id: string; kind: "server" | "folder" };

const END_ROW: RailRow = { type: "end" };

/** Empty space under the last item: dropping there appends at the bottom. */
function RailEndZone({ showLine }: { showLine: boolean }) {
	return (
		<div {...rowDataAttrs(END_ROW)} className="relative min-h-6 w-full flex-1">
			{showLine ? (
				<span
					aria-hidden
					className="pointer-events-none absolute top-0 left-1/2 h-[3px] w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
				/>
			) : null}
		</div>
	);
}

/** The rail row under the pointer, read from the live DOM. */
function rowAtPoint(
	x: number,
	y: number,
): { row: RailRow; rect: DOMRect } | null {
	for (const el of document.elementsFromPoint(x, y)) {
		if (!(el instanceof HTMLElement) || !el.dataset.railRow) continue;
		const row = readRowAttrs(el);
		if (row) return { row, rect: el.getBoundingClientRect() };
	}
	return null;
}

/**
 * Slides rail items from their previous spot to the new one whenever the
 * layout changes (FLIP), so reorders and folder changes animate instead of
 * jumping. Positions are measured relative to the scroll container.
 */
function useFlip(
	container: React.RefObject<HTMLDivElement | null>,
	layout: ChatLayout,
	expanded: Set<string>,
	skipId: string | null,
) {
	const last = useRef(new Map<string, number>());
	// biome-ignore lint/correctness/useExhaustiveDependencies: layout and expanded are the triggers, the DOM is what gets measured
	useLayoutEffect(() => {
		const root = container.current;
		if (!root) return;
		const base = root.getBoundingClientRect().top - root.scrollTop;
		const next = new Map<string, number>();
		const reduce = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		for (const el of root.querySelectorAll<HTMLElement>("[data-flip]")) {
			const id = el.dataset.flip;
			if (!id) continue;
			const top = el.getBoundingClientRect().top - base;
			next.set(id, top);
			const prev = last.current.get(id);
			if (reduce || prev === undefined || id === skipId) continue;
			const dy = prev - top;
			if (Math.abs(dy) < 1) continue;
			el.animate(
				[{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
				{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" },
			);
		}
		last.current = next;
	}, [container, layout, expanded, skipId]);
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
	const layoutKey = orpc.sidebarLayout.get.queryKey({ input: undefined });
	const layoutQuery = useQuery(
		orpc.sidebarLayout.get.queryOptions({ input: undefined }),
	);
	const servers: RailServer[] = useMemo(
		() => layoutQuery.data?.servers ?? [],
		[layoutQuery.data?.servers],
	);

	const [layout, setLayout] = useState<ChatLayout>({ items: [] });
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
	const [active, setActive] = useState<ActiveDrag | null>(null);
	const [target, setTarget] = useState<RailTarget | null>(null);
	const [lastDropped, setLastDropped] = useState<string | null>(null);
	// local edits not yet saved win over refetched server data
	const pendingSave = useRef(false);
	useEffect(() => {
		if (layoutQuery.data && !pendingSave.current)
			setLayout({ items: layoutQuery.data.items });
	}, [layoutQuery.data]);

	const save = useMutation({
		mutationFn: (items: ChatLayout["items"]) =>
			client.sidebarLayout.save({ items }),
		onSuccess: (_res, items) => {
			pendingSave.current = false;
			qc.setQueryData(layoutKey, (old) => (old ? { ...old, items } : old));
		},
		onError: (e: Error) => {
			pendingSave.current = false;
			toast.error(e.message);
			// roll the rail back to the last server-confirmed layout
			qc.invalidateQueries({ queryKey: orpc.sidebarLayout.get.queryKey() });
		},
	});

	const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const commit = (next: ChatLayout) => {
		setLayout(next);
		pendingSave.current = true;
		clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => save.mutate(next.items), 500);
	};
	useEffect(() => () => clearTimeout(saveTimer.current), []);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const listRef = useRef<HTMLDivElement>(null);
	useFlip(listRef, layout, expanded, lastDropped);

	const onDragStart = (e: DragStartEvent) => {
		const kind = e.active.data.current?.kind === "folder" ? "folder" : "server";
		setActive({ id: String(e.active.id), kind });
		const start = e.activatorEvent;
		pointerRef.current =
			start instanceof MouseEvent
				? { x: start.clientX, y: start.clientY }
				: null;
		targetRef.current = null;
		setTarget(null);
	};

	// The target is computed from the live pointer (not from dnd-kit's
	// batched drag deltas) so it always matches where the user lets go.
	const pointerRef = useRef<{ x: number; y: number } | null>(null);
	const targetRef = useRef<RailTarget | null>(null);
	const setRailTarget = (next: RailTarget | null) => {
		const cur = targetRef.current;
		if (
			cur?.indicator.rowKey === next?.indicator.rowKey &&
			cur?.indicator.pos === next?.indicator.pos
		)
			return;
		targetRef.current = next;
		setTarget(next);
	};

	/** undefined means "between rows": keep the current target. */
	const computeTarget = (
		drag: ActiveDrag,
		p: { x: number; y: number },
	): RailTarget | null | undefined => {
		const list = listRef.current?.getBoundingClientRect();
		if (!list) return undefined;
		const inRail =
			p.x >= list.left - 24 &&
			p.x <= list.right + 24 &&
			p.y >= list.top - 24 &&
			p.y <= list.bottom + 24;
		if (!inRail) return null;
		// probe at the rail's centre so a slightly sideways drag still hits a row
		const hit = rowAtPoint(list.left + list.width / 2, p.y);
		if (!hit) return undefined;
		const rel =
			hit.rect.height > 0 ? (p.y - hit.rect.top) / hit.rect.height : 0.5;
		const next = resolveRailTarget(hit.row, rel, drag.kind);
		return next && !isNoopDrop(layout, drag.id, next.drop) ? next : null;
	};

	const refreshTarget = () => {
		const p = pointerRef.current;
		if (!active || !p) return;
		const next = computeTarget(active, p);
		if (next !== undefined) setRailTarget(next);
	};
	const refreshRef = useRef(refreshTarget);
	refreshRef.current = refreshTarget;

	useEffect(() => {
		if (!active) return;
		const onMove = (e: PointerEvent) => {
			pointerRef.current = { x: e.clientX, y: e.clientY };
			refreshRef.current();
		};
		const onScroll = () => refreshRef.current();
		const list = listRef.current;
		window.addEventListener("pointermove", onMove);
		list?.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("pointermove", onMove);
			list?.removeEventListener("scroll", onScroll);
		};
	}, [active]);

	const onDragEnd = (_e: DragEndEvent) => {
		const p = pointerRef.current;
		const final = active && p ? computeTarget(active, p) : undefined;
		const chosen = final === undefined ? targetRef.current : final;
		if (active && chosen) {
			const next = applyDrop(layout, active.id, chosen.drop, {
				makeFolderId: () => crypto.randomUUID(),
				makeFolderName: t("newFolder"),
			});
			if (next !== layout) {
				setLastDropped(active.id);
				commit(next);
			}
		}
		endDrag();
	};

	const endDrag = () => {
		setActive(null);
		setTarget(null);
		targetRef.current = null;
		pointerRef.current = null;
	};

	const onDragCancel = () => endDrag();

	const indicatorFor = useCallback(
		(key: string) =>
			target && target.indicator.rowKey === key ? target.indicator.pos : null,
		[target],
	);

	const toggleFolder = (fid: string) =>
		setExpanded((cur) => {
			const next = new Set(cur);
			if (next.has(fid)) next.delete(fid);
			else next.add(fid);
			return next;
		});

	const renameFolder = (fid: string) => {
		const folder = layout.items.find(
			(i) => i.type === "folder" && i.id === fid,
		);
		const cur = folder?.type === "folder" ? folder.name : "";
		const name = window.prompt(t("renameFolder"), cur);
		if (name == null) return;
		const trimmed = name.trim().slice(0, 64);
		if (!trimmed) return;
		commit({
			items: layout.items.map((i) =>
				i.type === "folder" && i.id === fid ? { ...i, name: trimmed } : i,
			),
		});
	};

	const removeFolder = (fid: string) => {
		const folder = layout.items.find(
			(i) => i.type === "folder" && i.id === fid,
		);
		const freed = folder?.type === "folder" ? folder.serverIds : [];
		const idx = layout.items.findIndex((i) => i.id === fid);
		const items = layout.items.slice();
		// the servers take the folder's place instead of jumping to the bottom
		items.splice(
			idx,
			1,
			...freed.map((sid) => ({ type: "server" as const, id: sid })),
		);
		commit({ items });
	};

	const activeServerId = view === "messages" ? null : view.serverId;
	const activeFolder =
		active?.kind === "folder"
			? layout.items.find((i) => i.type === "folder" && i.id === active.id)
			: undefined;

	return (
		<div className="flex h-full w-16 shrink-0 flex-col items-center border-r border-border bg-card">
			<div className="flex h-14 w-full shrink-0 items-center justify-center border-b border-border">
				<Link
					to="/"
					aria-label={t("backToHeadpat")}
					title={t("backToHeadpat")}
					className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-muted"
				>
					<BrandLogo
						size="sm"
						alt={t("backToHeadpat")}
						className="size-7 rounded-md"
					/>
				</Link>
			</div>

			<div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 pt-3">
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

				<div
					ref={listRef}
					className={cn(
						"flex w-full flex-1 flex-col items-center overflow-y-auto overflow-x-hidden",
						active && "cursor-grabbing",
					)}
				>
					<DndContext
						sensors={sensors}
						onDragStart={onDragStart}
						onDragEnd={onDragEnd}
						onDragCancel={onDragCancel}
					>
						{layout.items.map((item) => {
							if (item.type === "server") {
								const row: RailRow = { type: "server", id: item.id };
								return (
									<RailSlot
										key={item.id}
										row={row}
										dragId={item.id}
										dragKind="server"
										indicator={indicatorFor(rowKey(row))}
									>
										{(slot) => (
											<RailServerButton
												server={servers.find((s) => s.id === item.id)}
												active={item.id === activeServerId}
												slot={slot}
												onSelect={() => onSelectServer(item.id)}
											/>
										)}
									</RailSlot>
								);
							}
							return (
								<div key={item.id} data-flip={item.id}>
									<ServerFolder
										id={item.id}
										name={item.name}
										serverIds={item.serverIds}
										servers={servers}
										expanded={expanded.has(item.id) && active?.id !== item.id}
										activeServerId={activeServerId}
										indicatorFor={indicatorFor}
										onToggle={toggleFolder}
										onSelectServer={onSelectServer}
										onRename={renameFolder}
										onRemove={removeFolder}
									/>
								</div>
							);
						})}
						<RailEndZone showLine={indicatorFor(rowKey(END_ROW)) === "top"} />

						<DragOverlay>
							{active?.kind === "server" ? (
								<ServerTile
									server={servers.find((s) => s.id === active.id)}
									className="scale-105 shadow-lg"
								/>
							) : activeFolder?.type === "folder" ? (
								<FolderTile
									serverIds={activeFolder.serverIds}
									servers={servers}
									className="scale-105 bg-muted shadow-lg"
								/>
							) : null}
						</DragOverlay>
					</DndContext>
				</div>
			</div>
		</div>
	);
}
