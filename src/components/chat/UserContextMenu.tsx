import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";

type Role = "owner" | "moderator" | "member";

type Props = {
	children: React.ReactNode;
	target: { userId: string; profileUrl: string | null; displayName: string };
	meId: string | undefined;
	conversationId?: string;
	viewerRole?: Role;
	targetRole?: Role;
	isGroup?: boolean;
	onChanged?: () => void;
};

export function UserContextMenu({
	children,
	target,
	meId,
	conversationId,
	viewerRole,
	targetRole,
	isGroup,
	onChanged,
}: Props) {
	const t = useTranslations("chatUi");
	const c = useTranslations("common");
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [open, setOpen] = useState(false);
	const [confirm, setConfirm] = useState<"transfer" | "remove" | null>(null);

	const isMe = target.userId === meId;

	const relationQ = useQuery({
		...orpc.relation.toUser.queryOptions({
			input: { targetUserId: target.userId },
		}),
		enabled: open && !isMe,
	});

	const viewProfile = () => {
		if (!target.profileUrl) return;
		navigate({ to: `/user/${target.profileUrl}` as never });
	};

	async function messageDirectly() {
		try {
			const { conversationId: id } = await client.message.openDirect({
				userId: target.userId,
			});
			navigate({ to: `/chat/dm/${id}` as never });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : String(e));
		}
	}

	async function toggleRelation(field: "isMuted" | "isBlocked") {
		const current =
			field === "isMuted"
				? !!relationQ.data?.isMuted
				: !!relationQ.data?.isBlocked;
		try {
			await client.relation.set({
				targetUserId: target.userId,
				[field]: !current,
			});
			await qc.invalidateQueries({
				queryKey: orpc.relation.toUser.queryKey({
					input: { targetUserId: target.userId },
				}),
			});
			toast.success(
				field === "isMuted"
					? t(current ? "unmuteUser" : "muteUser")
					: t(current ? "unblockUser" : "blockUser"),
			);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : String(e));
		}
	}

	async function setRole(role: "moderator" | "member") {
		if (!conversationId) return;
		try {
			await client.message.setRole({
				conversationId,
				userId: target.userId,
				role,
			});
			toast.success(
				role === "moderator" ? t("promoteToModerator") : t("demoteToMember"),
			);
			onChanged?.();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : String(e));
		}
	}

	async function transferOwnership() {
		if (!conversationId) return;
		try {
			await client.message.transferOwnership({
				conversationId,
				newOwnerId: target.userId,
			});
			toast.success(t("transferOwnershipConfirmTitle"));
			onChanged?.();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : String(e));
		}
	}

	async function removeParticipant() {
		if (!conversationId) return;
		try {
			await client.message.removeParticipant({
				conversationId,
				userId: target.userId,
			});
			toast.success(t("removeFromGroup"));
			onChanged?.();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : String(e));
		}
	}

	const isMuted = !!relationQ.data?.isMuted;
	const isBlocked = !!relationQ.data?.isBlocked;

	const canManageGroup = !!isGroup && !!conversationId && !!viewerRole && !isMe;
	const canRemove =
		canManageGroup &&
		(viewerRole === "owner"
			? targetRole === "moderator" || targetRole === "member"
			: viewerRole === "moderator" && targetRole === "member");
	const showGroupSection =
		canManageGroup &&
		(viewerRole === "owner" ||
			(viewerRole === "moderator" && targetRole === "member"));

	return (
		<>
			<ContextMenu onOpenChange={setOpen}>
				<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
				<ContextMenuContent className="w-52">
					{isMe ? (
						<ContextMenuItem
							disabled={!target.profileUrl}
							onSelect={viewProfile}
						>
							{t("viewProfile")}
						</ContextMenuItem>
					) : (
						<>
							<ContextMenuItem
								disabled={!target.profileUrl}
								onSelect={viewProfile}
							>
								{t("viewProfile")}
							</ContextMenuItem>
							{isBlocked ? null : (
								<ContextMenuItem onSelect={() => void messageDirectly()}>
									{t("messageDirectly")}
								</ContextMenuItem>
							)}
							<ContextMenuSeparator />
							<ContextMenuItem onSelect={() => void toggleRelation("isMuted")}>
								{isMuted ? t("unmuteUser") : t("muteUser")}
							</ContextMenuItem>
							<ContextMenuItem
								onSelect={() => void toggleRelation("isBlocked")}
							>
								{isBlocked ? t("unblockUser") : t("blockUser")}
							</ContextMenuItem>
							{showGroupSection ? <ContextMenuSeparator /> : null}
							{canManageGroup &&
							viewerRole === "owner" &&
							targetRole === "member" ? (
								<ContextMenuItem onSelect={() => void setRole("moderator")}>
									{t("promoteToModerator")}
								</ContextMenuItem>
							) : null}
							{canManageGroup &&
							viewerRole === "owner" &&
							targetRole === "moderator" ? (
								<ContextMenuItem onSelect={() => void setRole("member")}>
									{t("demoteToMember")}
								</ContextMenuItem>
							) : null}
							{canManageGroup && viewerRole === "owner" ? (
								<ContextMenuItem onSelect={() => setConfirm("transfer")}>
									{t("transferOwnership")}
								</ContextMenuItem>
							) : null}
							{canRemove ? (
								<ContextMenuItem
									className="text-destructive focus:text-destructive"
									onSelect={() => setConfirm("remove")}
								>
									{t("removeFromGroup")}
								</ContextMenuItem>
							) : null}
						</>
					)}
				</ContextMenuContent>
			</ContextMenu>

			<AlertDialog
				open={confirm === "transfer"}
				onOpenChange={(o) => {
					if (!o) setConfirm(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("transferOwnershipConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("transferOwnershipConfirmBody", { name: target.displayName })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								setConfirm(null);
								void transferOwnership();
							}}
						>
							{t("transferOwnership")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={confirm === "remove"}
				onOpenChange={(o) => {
					if (!o) setConfirm(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("removeFromGroupConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("removeFromGroupConfirmBody", { name: target.displayName })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={(e) => {
								e.preventDefault();
								setConfirm(null);
								void removeParticipant();
							}}
						>
							{t("removeFromGroup")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
