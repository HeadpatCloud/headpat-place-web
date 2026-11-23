import { type ReactNode, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";

/** Confirm a staff action and say why. The reason lands in the audit log. */
export function ReasonConfirm({
	title,
	body,
	confirmLabel,
	destructive,
	trigger,
	onConfirm,
}: {
	title: string;
	body?: string;
	confirmLabel: string;
	destructive?: boolean;
	trigger: ReactNode;
	onConfirm: (reason: string) => void;
}) {
	const t = useTranslations("adminPanel");
	const [reason, setReason] = useState("");
	return (
		<AlertDialog onOpenChange={(open) => (open ? null : setReason(""))}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{body ? (
						<AlertDialogDescription>{body}</AlertDialogDescription>
					) : null}
				</AlertDialogHeader>
				<div className="space-y-1.5">
					<Label htmlFor="action-reason">{t("reasonLabel")}</Label>
					<Textarea
						id="action-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={2}
						maxLength={500}
					/>
					<p className="text-xs text-muted-foreground">{t("reasonHint")}</p>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						disabled={!reason.trim()}
						className={
							destructive
								? "bg-destructive text-white hover:bg-destructive/90"
								: "bg-primary text-primary-foreground hover:bg-primary/90"
						}
						onClick={() => onConfirm(reason.trim())}
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
