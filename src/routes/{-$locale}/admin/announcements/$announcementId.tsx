import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RichBioEditor } from "@/components/profile/RichBioEditor";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import { useLocalizedNavigate as useNavigate } from "@/lib/localized-nav";
import { client, orpc } from "@/lib/orpc";
import { ensureHtml } from "@/lib/rich-text";

export const Route = createFileRoute(
	"/{-$locale}/admin/announcements/$announcementId",
)({ component: AnnouncementEditor });

const toDateInput = (d: string | Date | null | undefined) =>
	d ? new Date(d).toISOString().slice(0, 10) : "";

function AnnouncementEditor() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const { announcementId } = Route.useParams();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const entry = useQuery(
		orpc.announcement.byId.queryOptions({ input: { announcementId } }),
	);

	const [title, setTitle] = useState("");
	const [sideText, setSideText] = useState("");
	const [description, setDescription] = useState("");
	const [validUntil, setValidUntil] = useState("");

	useEffect(() => {
		const a = entry.data;
		if (!a) return;
		setTitle(a.title ?? "");
		setSideText(a.sideText ?? "");
		setDescription(ensureHtml(a.description));
		setValidUntil(toDateInput(a.validUntil));
	}, [entry.data]);

	const save = useMutation({
		mutationFn: () =>
			client.announcement.adminUpsert({
				id: announcementId,
				title: title.trim() || undefined,
				sideText: sideText.trim() || undefined,
				description: description.trim(),
				validUntil: validUntil ? new Date(validUntil) : null,
			}),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: orpc.announcement.byId.queryKey({
					input: { announcementId },
				}),
			});
			qc.invalidateQueries({ queryKey: orpc.announcement.adminList.key() });
			toast.success(t("saved"));
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const remove = useMutation({
		mutationFn: () => client.announcement.adminDelete({ announcementId }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: orpc.announcement.adminList.key() });
			toast.success(t("deleted"));
			navigate({ to: "/admin/announcements" as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	if (entry.isPending)
		return <p className="text-muted-foreground">{c("loading")}</p>;
	if (entry.isError || !entry.data) {
		const notFound =
			(entry.error as { code?: string } | null)?.code === "NOT_FOUND";
		return (
			<p className="text-muted-foreground">
				{notFound ? t("announcementNotFound") : t("announcementLoadFailed")}
			</p>
		);
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-extrabold tracking-tight">
				{t("editAnnouncement")}
			</h1>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>{t("details")}</CardTitle>
					<Button
						onClick={() =>
							description.trim()
								? save.mutate()
								: toast.error(t("descriptionRequired"))
						}
						disabled={save.isPending}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						{c("save")}
					</Button>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="an-title">{t("title")}</Label>
							<Input
								id="an-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								maxLength={200}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="an-side">{t("sideText")}</Label>
							<Input
								id="an-side"
								value={sideText}
								onChange={(e) => setSideText(e.target.value)}
								maxLength={200}
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label>{t("description")}</Label>
						<RichBioEditor
							initialHtml={ensureHtml(entry.data.description)}
							onChange={setDescription}
							enableImages={false}
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label htmlFor="an-until" className="text-sm">
							{t("validUntil")}
						</Label>
						<Input
							id="an-until"
							type="date"
							value={validUntil}
							onChange={(e) => setValidUntil(e.target.value)}
							className="w-auto"
						/>
						<span className="text-xs text-muted-foreground">
							{t("validUntilHint")}
						</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("dangerZone")}</CardTitle>
				</CardHeader>
				<CardContent>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive">{t("deleteAnnouncement")}</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									{t("deleteAnnouncementConfirm")}
								</AlertDialogTitle>
								<AlertDialogDescription>
									{t("cannotBeUndone")}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => remove.mutate()}
									disabled={remove.isPending}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									{c("delete")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardContent>
			</Card>
		</div>
	);
}
