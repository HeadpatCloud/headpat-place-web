import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DangerZone({ onDelete }: { onDelete: () => void }) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border border-destructive/40 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h3 className="text-sm font-semibold">Delete account</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Permanently delete your account and all of its data. This can't be
					undone.
				</p>
			</div>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="destructive" className="shrink-0">
						Delete account
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This permanently deletes your account, profile, uploads, and
						messages. There's no going back.
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction asChild>
							<Button
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								onClick={onDelete}
							>
								Delete account
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
