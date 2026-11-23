import type { ADULT_LOOKING_FOR } from "@backend/lib/discovery";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useBlurAdult, useSetBlurAdult } from "@/lib/blur-adult";
import { useDiscoveryOptions } from "@/lib/discovery-options";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";
import { uploadImage } from "@/lib/upload-image";
import { BlurredImage } from "./BlurredImage";
import { ToggleChips } from "./InterestsEditor";
import { ImagePick } from "./SonasEditor";
import { TagInput } from "./TagInput";

type AdultLookingFor = (typeof ADULT_LOOKING_FOR)[number];

// The separate 18+ profile. Only rendered for people who can have one (known
// adult birthday + NSFW on); the API enforces the same rule.
export function AdultProfileEditor() {
	const t = useTranslations("discovery");
	const qc = useQueryClient();
	const mine = useQuery(orpc.discovery.adult.mine.queryOptions({ input: {} }));
	const options = useDiscoveryOptions();
	const [enabled, setEnabled] = useState(false);
	const [displayName, setDisplayName] = useState("");
	const [avatarFileId, setAvatarFileId] = useState<string | null>(null);
	const [bio, setBio] = useState("");
	const [into, setInto] = useState<string[]>([]);
	const [lookingFor, setLookingFor] = useState<AdultLookingFor[]>([]);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);
	const blurAdult = useBlurAdult();
	const setBlurAdult = useSetBlurAdult();

	useEffect(() => {
		const a = mine.data;
		if (!a) return;
		setEnabled(a.enabled);
		setDisplayName(a.displayName ?? "");
		setAvatarFileId(a.avatarFileId);
		setBio(a.bio ?? "");
		setInto(a.into);
		setLookingFor(a.lookingFor);
	}, [mine.data]);

	const refresh = () =>
		qc.invalidateQueries({ queryKey: orpc.discovery.key() });

	const save = async () => {
		setSaving(true);
		try {
			await client.discovery.adult.save({
				enabled,
				displayName: displayName.trim() || null,
				avatarFileId,
				bio: bio.trim() || null,
				into,
				lookingFor,
			});
			await refresh();
			toast.success(t("saved"));
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setSaving(false);
		}
	};

	const photos = mine.data?.photos ?? [];
	const maxPhotos = options.maxAdultPhotos;

	return (
		<div className="space-y-6">
			<p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
				{t("adultIntro")}
			</p>
			<div className="flex items-center justify-between gap-3">
				<div>
					<Label htmlFor="adult-blur">{t("blurAdult")}</Label>
					<p className="text-sm text-muted-foreground">{t("blurAdultHint")}</p>
				</div>
				<Switch
					id="adult-blur"
					checked={blurAdult}
					onCheckedChange={setBlurAdult}
				/>
			</div>
			<div className="flex items-center justify-between gap-3">
				<Label htmlFor="adult-enabled">{t("adultEnabled")}</Label>
				<Switch
					id="adult-enabled"
					checked={enabled}
					onCheckedChange={setEnabled}
				/>
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="adult-name">{t("adultName")}</Label>
				<Input
					id="adult-name"
					value={displayName}
					maxLength={80}
					placeholder={t("adultNameHint")}
					onChange={(e) => setDisplayName(e.target.value)}
				/>
			</div>
			<ImagePick
				kind="avatar"
				square
				label={t("adultPicture")}
				fileId={avatarFileId}
				onChange={setAvatarFileId}
			/>
			<div className="space-y-1.5">
				<Label htmlFor="adult-bio">{t("adultBio")}</Label>
				<Textarea
					id="adult-bio"
					value={bio}
					rows={5}
					maxLength={4000}
					onChange={(e) => setBio(e.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label>{t("into")}</Label>
				<TagInput
					kind="into"
					value={into}
					onChange={setInto}
					max={options.maxInto}
					placeholder={t("intoPlaceholder")}
					label={t("into")}
				/>
			</div>
			<div className="space-y-2">
				<Label>{t("lookingForTitle")}</Label>
				<ToggleChips
					options={options.adultLookingFor}
					value={lookingFor}
					onChange={setLookingFor}
					label={(k) => t(`adultLookingFor.${k}`)}
				/>
			</div>
			<Button onClick={save} disabled={saving || mine.isPending}>
				{t("save")}
			</Button>

			<div className="space-y-3 border-t border-border pt-6">
				<p className="text-sm font-semibold">{t("adultPhotos")}</p>
				<p className="text-sm text-muted-foreground">{t("adultPhotosHint")}</p>
				{mine.data ? (
					<>
						<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
							{photos.map((p) => (
								<div key={p.id} className="relative">
									<BlurredImage fileId={p.fileId} className="aspect-square" />
									<Button
										variant="secondary"
										size="icon"
										className="absolute top-1.5 right-1.5 size-7"
										aria-label={t("removePhoto")}
										onClick={async () => {
											await client.discovery.adult.removePhoto({ id: p.id });
											await refresh();
										}}
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</div>
							))}
						</div>
						<input
							ref={fileRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={async (e) => {
								const f = e.target.files?.[0];
								e.target.value = "";
								if (!f) return;
								setUploading(true);
								try {
									const fileId = await uploadImage("gallery", f);
									await client.discovery.adult.addPhoto({ fileId });
									await refresh();
								} catch (err) {
									toast.error((err as Error).message);
								} finally {
									setUploading(false);
								}
							}}
						/>
						<Button
							variant="secondary"
							disabled={uploading || photos.length >= maxPhotos}
							onClick={() => fileRef.current?.click()}
						>
							<PlusIcon className="size-4" />
							{uploading ? t("uploading") : t("addPhoto")}
						</Button>
					</>
				) : (
					<p className="text-sm text-muted-foreground">{t("adultSaveFirst")}</p>
				)}
			</div>

			{mine.data ? (
				<div className="border-t border-border pt-6">
					<Button
						variant="ghost"
						className="text-destructive"
						onClick={async () => {
							if (!window.confirm(t("adultDeleteConfirm"))) return;
							await client.discovery.adult.delete({});
							await refresh();
						}}
					>
						{t("adultDelete")}
					</Button>
				</div>
			) : null}
		</div>
	);
}
