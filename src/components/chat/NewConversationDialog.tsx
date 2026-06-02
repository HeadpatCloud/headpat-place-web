import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StorageImage } from "@/components/StorageImage";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { client, orpc } from "@/lib/orpc";

export function NewConversationDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
}) {
	const qc = useQueryClient();
	const navigate = useNavigate();
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [name, setName] = useState("");

	const following = useQuery({
		...orpc.follow.following.queryOptions({
			input: { page: 1, pageSize: 100 },
		}),
		enabled: open,
	});

	const reset = () => {
		setSelected(new Set());
		setName("");
	};

	const start = useMutation({
		mutationFn: () =>
			client.message.startConversation({
				participantUserIds: [...selected],
				name: name.trim() || undefined,
			}),
		onSuccess: async (conv) => {
			await qc.invalidateQueries({
				queryKey: orpc.message.myConversations.key(),
			});
			onOpenChange(false);
			reset();
			navigate({ to: `/chat/dm/${conv.id}` as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const toggle = (userId: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(userId)) next.delete(userId);
			else next.add(userId);
			return next;
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="chat-scope max-w-md">
				<DialogHeader>
					<DialogTitle>New message</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-1">
					<label
						htmlFor="group-name"
						className="text-xs font-medium text-muted-foreground"
					>
						Group name (optional)
					</label>
					<Input
						id="group-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={100}
						placeholder="e.g. Weekend crew"
					/>
				</div>

				<div className="mt-1 max-h-72 overflow-y-auto rounded-md border border-border">
					{following.data?.items.length ? (
						following.data.items.map((u) => {
							const label = u.displayName || u.name || "User";
							const checked = selected.has(u.userId);
							return (
								<button
									key={u.userId}
									type="button"
									onClick={() => toggle(u.userId)}
									className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
										checked
											? "bg-primary/15 text-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									<StorageImage
										kind="avatar"
										fileId={u.avatarFileId}
										variant="sm"
										className="size-6.5 shrink-0 rounded-full object-cover bg-muted"
										fallback={
											<div className="flex size-6.5 items-center justify-center rounded-full bg-muted text-xs font-semibold leading-none">
												{(label.trim().charAt(0) || "?").toUpperCase()}
											</div>
										}
									/>
									<span className="flex-1 truncate text-sm font-medium">
										{label}
									</span>
									{checked ? (
										<CheckIcon className="size-4 shrink-0 text-primary" />
									) : null}
								</button>
							);
						})
					) : (
						<div className="px-3 py-6 text-center text-sm text-muted-foreground">
							{following.isLoading
								? "Loading…"
								: "You aren't following anyone."}
						</div>
					)}
				</div>

				<DialogFooter className="mt-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							onOpenChange(false);
							reset();
						}}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => start.mutate()}
						disabled={selected.size === 0 || start.isPending}
					>
						Start
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
