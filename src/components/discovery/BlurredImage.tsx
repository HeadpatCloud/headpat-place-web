import { EyeIcon } from "lucide-react";
import { useState } from "react";
import { StorageImage } from "@/components/StorageImage";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 18+ photos stay blurred in the grid; opening one shows it full size and
// unblurred. Nothing is shown unblurred until someone asks for it.
export function BlurredImage({
	fileId,
	caption,
	className,
}: {
	fileId: string;
	caption?: string | null;
	className?: string;
}) {
	const t = useTranslations("discovery");
	const [open, setOpen] = useState(false);
	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(
					"group relative block w-full overflow-hidden rounded-xl bg-muted",
					className,
				)}
				aria-label={t("showPhoto")}
			>
				<StorageImage
					kind="gallery"
					fileId={fileId}
					variant="320"
					className="h-full w-full scale-110 object-cover blur-2xl"
					fallback={null}
				/>
				<span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 text-xs font-semibold text-white">
					<EyeIcon className="size-5" />
					{t("showPhoto")}
				</span>
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-3xl p-2">
					<DialogTitle className="sr-only">{t("adultPhotos")}</DialogTitle>
					<StorageImage
						kind="gallery"
						fileId={fileId}
						variant="1280"
						className="max-h-[80svh] w-full rounded-lg object-contain"
						fallback={null}
					/>
					{caption ? (
						<DialogDescription className="px-2 pb-1">
							{caption}
						</DialogDescription>
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}
