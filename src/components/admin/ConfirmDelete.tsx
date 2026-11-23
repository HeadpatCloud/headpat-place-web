import { Trash2Icon } from "lucide-react";
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";

/**
 * Delete confirmation for staff. Always asks why (it lands in the staff audit
 * log, never shown to the owner); `typeToConfirm` also makes them type the
 * name for things that take a lot with them.
 */
export function ConfirmDelete({
	name,
	onConfirm,
	disabled,
	typeToConfirm,
	trigger,
}: {
	name: string;
	onConfirm: (reason: string) => void;
	disabled?: boolean;
	typeToConfirm?: boolean;
	trigger?: React.ReactNode;
}) {
	const t = useTranslations("adminPanel");
	const [reason, setReason] = useState("");
	const [typed, setTyped] = useState("");
	const ready =
		reason.trim().length > 0 &&
		(!typeToConfirm || typed.trim() === name.trim());
	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) {
					setReason("");
					setTyped("");
				}
			}}
		>
			<AlertDialogTrigger asChild>
				{trigger ?? (
					<Button
						variant="ghost"
						size="icon"
						className="text-destructive hover:bg-destructive/10 hover:text-destructive"
						aria-label={`${t("delete")}: ${name}`}
						disabled={disabled}
					>
						<Trash2Icon />
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("confirmDeleteTitle", { name })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("confirmDeleteBody")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="delete-reason">{t("reasonLabel")}</Label>
						<Textarea
							id="delete-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder={t("reasonPlaceholder")}
							rows={2}
							maxLength={500}
						/>
						<p className="text-xs text-muted-foreground">{t("reasonHint")}</p>
					</div>
					{typeToConfirm ? (
						<div className="space-y-1.5">
							<Label htmlFor="delete-type">
								{t("typeToConfirm", { name })}
							</Label>
							<Input
								id="delete-type"
								value={typed}
								onChange={(e) => setTyped(e.target.value)}
								autoComplete="off"
							/>
						</div>
					) : null}
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-white hover:bg-destructive/90"
						disabled={!ready}
						onClick={() => onConfirm(reason.trim())}
					>
						{t("delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
