import { useQuery } from "@tanstack/react-query";
import { FlameIcon } from "lucide-react";
import { useState } from "react";
import { StorageImage } from "@/components/StorageImage";
import { UserText } from "@/components/UserText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";
import { BlurredImage } from "./BlurredImage";

export function useProfileDiscovery(userId: string | undefined) {
	return useQuery({
		...orpc.discovery.get.queryOptions({ input: { userId: userId ?? "" } }),
		enabled: !!userId,
	});
}

type Sona = {
	id: string;
	name: string;
	species: string | null;
	pronouns: string | null;
	description: string | null;
	avatarFileId: string | null;
	refSheetFileId: string | null;
	colors: string[];
};

/** "Looking for" and interests under the profile header, plus the 18+ button. */
export function DiscoveryChips({
	userId,
	name,
}: {
	userId: string;
	name: string;
}) {
	const t = useTranslations("discovery");
	const d = useProfileDiscovery(userId);
	const [adultOpen, setAdultOpen] = useState(false);
	if (!d.data) return null;
	const { lookingFor, interests, hasAdult } = d.data;
	if (!lookingFor.length && !interests.length && !hasAdult) return null;
	return (
		<div className="space-y-2">
			{lookingFor.length ? (
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-xs font-semibold text-muted-foreground">
						{t("lookingForTitle")}
					</span>
					{lookingFor.map((k) => (
						<Badge key={k}>{t(`lookingFor.${k}`)}</Badge>
					))}
				</div>
			) : null}
			{interests.length ? (
				<div className="flex flex-wrap gap-1.5">
					{interests.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</div>
			) : null}
			{hasAdult ? (
				<>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => setAdultOpen(true)}
					>
						<FlameIcon className="size-4" />
						{t("openAdult")}
					</Button>
					<AdultProfileDialog
						userId={userId}
						fallbackName={name}
						open={adultOpen}
						onOpenChange={setAdultOpen}
					/>
				</>
			) : null}
		</div>
	);
}

export function SonaList({ sonas }: { sonas: Sona[] }) {
	const t = useTranslations("discovery");
	if (sonas.length === 0)
		return <p className="text-muted-foreground">{t("noSonasPublic")}</p>;
	return (
		<div className="space-y-4">
			{sonas.map((s) => (
				<article
					key={s.id}
					className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row"
				>
					<StorageImage
						kind="avatar"
						fileId={s.avatarFileId}
						variant="md"
						className="size-24 shrink-0 rounded-2xl object-cover"
						fallback={<div className="size-24 shrink-0 rounded-2xl bg-muted" />}
					/>
					<div className="min-w-0 flex-1 space-y-2">
						<div>
							<p className="font-display text-lg font-bold">{s.name}</p>
							<p className="text-sm text-muted-foreground">
								{[s.species, s.pronouns].filter(Boolean).join(" · ")}
							</p>
						</div>
						{s.colors.length ? (
							<ul
								className="flex flex-wrap gap-1.5"
								aria-label={t("sonaColors")}
							>
								{s.colors.map((c) => (
									<li
										key={c}
										title={c}
										className="size-6 rounded-full border border-border"
										style={{ backgroundColor: c }}
									/>
								))}
							</ul>
						) : null}
						{s.description ? (
							<p className="whitespace-pre-wrap text-sm">
								<UserText text={s.description} />
							</p>
						) : null}
						{s.refSheetFileId ? <RefSheet fileId={s.refSheetFileId} /> : null}
					</div>
				</article>
			))}
		</div>
	);
}

function RefSheet({ fileId }: { fileId: string }) {
	const t = useTranslations("discovery");
	const [open, setOpen] = useState(false);
	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex w-full cursor-zoom-in justify-center overflow-hidden rounded-xl border border-border bg-muted"
				aria-label={t("sonaRefSheet")}
			>
				{/* Whole sheet at its own shape: ref sheets are wide, tall or square. */}
				<StorageImage
					kind="gallery"
					fileId={fileId}
					variant="1280"
					className="block h-auto max-h-[28rem] w-auto max-w-full"
					fallback={null}
				/>
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-5xl p-2">
					<DialogTitle className="sr-only">{t("sonaRefSheet")}</DialogTitle>
					<StorageImage
						kind="gallery"
						fileId={fileId}
						variant="1600"
						className="max-h-[85svh] w-full rounded-lg object-contain"
						fallback={null}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

function AdultProfileDialog({
	userId,
	fallbackName,
	open,
	onOpenChange,
}: {
	userId: string;
	fallbackName: string;
	open: boolean;
	onOpenChange: (o: boolean) => void;
}) {
	const t = useTranslations("discovery");
	const q = useQuery({
		...orpc.discovery.adult.get.queryOptions({ input: { userId } }),
		enabled: open,
	});
	const a = q.data;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FlameIcon className="size-5 text-destructive" />
						{a?.displayName || fallbackName}
					</DialogTitle>
					<DialogDescription>{t("adultBadge")}</DialogDescription>
				</DialogHeader>
				{!a ? (
					<p className="text-muted-foreground">
						{q.isPending ? t("loading") : t("adultUnavailable")}
					</p>
				) : (
					<div className="space-y-4">
						<div className="flex gap-4">
							<StorageImage
								kind="avatar"
								fileId={a.avatarFileId}
								variant="md"
								className="size-24 shrink-0 rounded-2xl object-cover"
								fallback={
									<div className="size-24 shrink-0 rounded-2xl bg-muted" />
								}
							/>
							{a.bio ? (
								<p className="whitespace-pre-wrap text-sm">
									<UserText text={a.bio} />
								</p>
							) : null}
						</div>
						{a.lookingFor.length ? (
							<div className="flex flex-wrap items-center gap-1.5">
								<span className="text-xs font-semibold text-muted-foreground">
									{t("lookingForTitle")}
								</span>
								{a.lookingFor.map((k) => (
									<Badge key={k}>{t(`adultLookingFor.${k}`)}</Badge>
								))}
							</div>
						) : null}
						{a.into.length ? (
							<div className="space-y-1.5">
								<p className="text-xs font-semibold text-muted-foreground">
									{t("into")}
								</p>
								<div className="flex flex-wrap gap-1.5">
									{a.into.map((tag) => (
										<Badge key={tag} variant="secondary">
											{tag}
										</Badge>
									))}
								</div>
							</div>
						) : null}
						{a.photos.length ? (
							<div className="grid grid-cols-3 gap-2">
								{a.photos.map((p) => (
									<BlurredImage
										key={p.id}
										fileId={p.fileId}
										caption={p.caption}
										className="aspect-square"
									/>
								))}
							</div>
						) : null}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
