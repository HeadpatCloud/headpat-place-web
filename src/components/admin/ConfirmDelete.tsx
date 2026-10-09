import { Trash2Icon } from "lucide-react";
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
import { useTranslations } from "@/lib/i18n";

export function ConfirmDelete({
	name,
	onConfirm,
	disabled,
}: {
	name: string;
	onConfirm: () => void;
	disabled?: boolean;
}) {
	const t = useTranslations("adminPanel");
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="text-destructive hover:bg-destructive/10 hover:text-destructive"
					aria-label={`${t("delete")}: ${name}`}
					disabled={disabled}
				>
					<Trash2Icon />
				</Button>
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
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-white hover:bg-destructive/90"
						onClick={onConfirm}
					>
						{t("delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
