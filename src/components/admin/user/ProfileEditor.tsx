import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

type AdminUser = Awaited<ReturnType<typeof client.adminUser.get>>;

const TEXT_FIELDS = [
	["displayName", "editDisplayName", 120],
	["profileUrl", "editProfileUrl", 64],
	["pronouns", "pronouns", 60],
	["status", "editStatus", 120],
	["location", "location", 120],
	["timezone", "timezone", 64],
	["discordName", "Discord", 60],
	["telegramName", "Telegram", 60],
	["furaffinityName", "FurAffinity", 60],
	["xName", "X", 60],
	["twitchName", "Twitch", 60],
	["blueskyName", "Bluesky", 60],
] as const;
type TextField = (typeof TEXT_FIELDS)[number][0];

/** Social network names are shown as-is; everything else is translated. */
const LITERAL = new Set([
	"Discord",
	"Telegram",
	"FurAffinity",
	"X",
	"Twitch",
	"Bluesky",
]);

export function ProfileEditor({ u }: { u: AdminUser }) {
	const t = useTranslations("adminPanel");
	const qc = useQueryClient();
	const [open, setOpen] = useState(false);
	const initial = () => ({
		...Object.fromEntries(TEXT_FIELDS.map(([k]) => [k, u[k] ?? ""])),
		bio: u.bio ?? "",
	});
	const [values, setValues] = useState<Record<string, string>>(initial);
	const [indexing, setIndexing] = useState(u.indexingEnabled ?? true);
	const [nsfw, setNsfw] = useState(u.nsfwEnabled ?? false);
	const [removeAvatar, setRemoveAvatar] = useState(false);
	const [removeBanner, setRemoveBanner] = useState(false);
	const [reason, setReason] = useState("");

	const save = useMutation({
		mutationFn: () => {
			const changed: Partial<Record<TextField | "bio", string>> = {};
			for (const [k] of TEXT_FIELDS) {
				if ((values[k] ?? "") !== (u[k] ?? "")) changed[k] = values[k];
			}
			if ((values.bio ?? "") !== (u.bio ?? "")) changed.bio = values.bio;
			return client.adminUser.updateProfile({
				userId: u.userId,
				...changed,
				...(indexing !== u.indexingEnabled
					? { indexingEnabled: indexing }
					: {}),
				...(nsfw !== u.nsfwEnabled ? { nsfwEnabled: nsfw } : {}),
				...(removeAvatar ? { removeAvatar } : {}),
				...(removeBanner ? { removeBanner } : {}),
				reason: reason.trim() || undefined,
			});
		},
		onSuccess: (r) => {
			toast.success(
				r.changed.length
					? t("profileSaved", { count: r.changed.length })
					: t("nothingChanged"),
			);
			qc.invalidateQueries({
				queryKey: orpc.adminUser.get.queryKey({ input: { userId: u.userId } }),
			});
			setOpen(false);
		},
		onError: (e: Error) => toast.error(e.message),
	});

	function submit(e: FormEvent) {
		e.preventDefault();
		save.mutate();
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (o) {
					setValues(initial());
					setIndexing(u.indexingEnabled ?? true);
					setNsfw(u.nsfwEnabled ?? false);
					setRemoveAvatar(false);
					setRemoveBanner(false);
					setReason("");
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<PencilIcon className="size-4" />
					{t("editProfile")}
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<form onSubmit={submit} className="space-y-4">
					<DialogHeader>
						<DialogTitle>{t("editProfile")}</DialogTitle>
						<DialogDescription>{t("editProfileHint")}</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 sm:grid-cols-2">
						{TEXT_FIELDS.map(([key, label, max]) => (
							<div key={key} className="space-y-1.5">
								<Label htmlFor={`edit-${key}`}>
									{LITERAL.has(label) ? label : t(label)}
								</Label>
								<Input
									id={`edit-${key}`}
									value={values[key] ?? ""}
									maxLength={max}
									onChange={(e) =>
										setValues((v) => ({ ...v, [key]: e.target.value }))
									}
								/>
							</div>
						))}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-bio">{t("editBio")}</Label>
						<Textarea
							id="edit-bio"
							rows={4}
							maxLength={2000}
							value={values.bio ?? ""}
							onChange={(e) =>
								setValues((v) => ({ ...v, bio: e.target.value }))
							}
						/>
						<p className="text-xs text-muted-foreground">{t("editBioHint")}</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-2">
						<div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
							<Label htmlFor="sw-editIndexing">{t("editIndexing")}</Label>
							<Switch
								id="sw-editIndexing"
								checked={indexing}
								onCheckedChange={setIndexing}
							/>
						</div>
						<div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
							<Label htmlFor="sw-nsfwEnabled">{t("nsfwEnabled")}</Label>
							<Switch
								id="sw-nsfwEnabled"
								checked={nsfw}
								onCheckedChange={setNsfw}
							/>
						</div>
						{u.avatarFileId ? (
							<div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
								<Label htmlFor="sw-removeAvatar">{t("removeAvatar")}</Label>
								<Switch
									id="sw-removeAvatar"
									checked={removeAvatar}
									onCheckedChange={setRemoveAvatar}
								/>
							</div>
						) : null}
						{u.bannerFileId ? (
							<div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
								<Label htmlFor="sw-removeBanner">{t("removeBanner")}</Label>
								<Switch
									id="sw-removeBanner"
									checked={removeBanner}
									onCheckedChange={setRemoveBanner}
								/>
							</div>
						) : null}
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="edit-reason">{t("reasonOptionalLabel")}</Label>
						<Input
							id="edit-reason"
							value={reason}
							maxLength={500}
							onChange={(e) => setReason(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">{t("reasonHint")}</p>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							{t("cancel")}
						</Button>
						<Button
							type="submit"
							disabled={save.isPending}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
						>
							{t("save")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
