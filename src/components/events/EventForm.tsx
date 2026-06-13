import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	LocationPicker,
	type LocationValue,
	type LocationZoneMethod,
} from "@/components/map/LocationPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputTags } from "@/components/ui/input-tags";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";

export type EventFormInitial = {
	id: string;
	title: string;
	label: string | null;
	description: string | null;
	startsAt: string | Date;
	endsAt: string | Date | null;
	locationZoneMethod: string;
	locationText: string | null;
	coordinates: string[] | null;
	circleRadius: number | null;
	communityId: string | null;
	website: string | null;
	visitorCapacity: number | null;
	tags: string[] | null;
	isPublic: boolean;
	isPaid: boolean;
};

type FormState = {
	title: string;
	label: string;
	description: string;
	startsAt: string;
	endsAt: string;
	location: LocationValue;
	locationText: string;
	communityId: string;
	website: string;
	visitorCapacity: string;
	tags: string[];
	isPublic: boolean;
	isPaid: boolean;
};

function toLocalInput(d: string | Date | null | undefined): string {
	if (!d) return "";
	const dt = new Date(d);
	if (Number.isNaN(dt.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function initState(initial?: EventFormInitial): FormState {
	return {
		title: initial?.title ?? "",
		label: initial?.label ?? "",
		description: initial?.description ?? "",
		startsAt: toLocalInput(initial?.startsAt),
		endsAt: toLocalInput(initial?.endsAt),
		location: {
			method: (initial?.locationZoneMethod as LocationZoneMethod) ?? "virtual",
			coordinates: initial?.coordinates ?? [],
			circleRadius: initial?.circleRadius ?? null,
		},
		locationText: initial?.locationText ?? "",
		communityId: initial?.communityId ?? "",
		website: initial?.website ?? "",
		visitorCapacity:
			initial?.visitorCapacity != null ? String(initial.visitorCapacity) : "",
		tags: initial?.tags ?? [],
		isPublic: initial?.isPublic ?? true,
		isPaid: initial?.isPaid ?? false,
	};
}

export function EventForm({
	mode,
	initial,
}: {
	mode: "create" | "edit";
	initial?: EventFormInitial;
}) {
	const t = useTranslations("eventsPages");
	const c = useTranslations("common");
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [form, setForm] = useState<FormState>(() => initState(initial));

	function setField<K extends keyof FormState>(key: K, val: FormState[K]) {
		setForm((f) => ({ ...f, [key]: val }));
	}

	const mine = useQuery(orpc.community.mine.queryOptions({ input: undefined }));
	const communities = mine.data ?? [];

	// In edit mode the event may live in a community the creator no longer has a
	// role in — keep it selectable so they can still save other fields.
	const currentMissing =
		!!initial?.communityId &&
		!communities.some((c) => c.id === initial.communityId);
	const currentCommunity = useQuery({
		...orpc.community.byId.queryOptions({
			input: { communityId: initial?.communityId ?? "" },
		}),
		enabled: currentMissing,
	});
	const options =
		currentMissing && initial?.communityId
			? [
					{
						id: initial.communityId,
						name: currentCommunity.data?.name ?? t("currentCommunity"),
					},
					...communities,
				]
			: communities;

	// auto-select when there's exactly one choice and nothing picked yet —
	// create only, so editing never silently attaches a community to an event
	useEffect(() => {
		if (mode !== "create") return;
		if (form.communityId) return;
		if (options.length === 1)
			setForm((f) => ({ ...f, communityId: options[0].id }));
	}, [mode, options, form.communityId]);

	const noCommunities =
		mode === "create" && mine.isSuccess && options.length === 0;

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: orpc.event.list.key() });
		qc.invalidateQueries({ queryKey: orpc.event.mapList.key() });
		if (initial) {
			qc.invalidateQueries({
				queryKey: orpc.event.byId.queryKey({ input: { eventId: initial.id } }),
			});
		}
	};

	const create = useMutation({
		mutationFn: (input: Parameters<typeof client.event.create>[0]) =>
			client.event.create(input),
		onSuccess: (row) => {
			invalidate();
			toast.success(t("eventCreated"));
			navigate({ to: `/events/${row.id}` as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const update = useMutation({
		mutationFn: (input: Parameters<typeof client.event.update>[0]) =>
			client.event.update(input),
		onSuccess: (row) => {
			invalidate();
			toast.success(t("eventSaved"));
			navigate({ to: `/events/${row.id}` as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const submitting = create.isPending || update.isPending;

	function validate(): {
		startsAt: Date;
		endsAt: Date | null;
		capacity: number | null;
		website: string | null;
	} | null {
		if (!form.title.trim()) {
			toast.error(t("validateTitle"));
			return null;
		}
		if (!form.communityId) {
			toast.error(t("validateCommunity"));
			return null;
		}
		if (!form.startsAt) {
			toast.error(t("validateStart"));
			return null;
		}
		const startsAt = new Date(form.startsAt);
		const endsAt = form.endsAt ? new Date(form.endsAt) : null;
		if (endsAt && endsAt < startsAt) {
			toast.error(t("validateEndBeforeStart"));
			return null;
		}
		let capacity: number | null = null;
		if (form.visitorCapacity.trim()) {
			capacity = Number(form.visitorCapacity);
			if (!Number.isInteger(capacity) || capacity < 1) {
				toast.error(t("validateCapacity"));
				return null;
			}
		}
		let website: string | null = null;
		const w = form.website.trim();
		if (w) {
			const withScheme = /^https?:\/\//i.test(w) ? w : `https://${w}`;
			try {
				const u = new URL(withScheme);
				if (u.protocol !== "http:" && u.protocol !== "https:")
					throw new Error();
				website = u.toString();
			} catch {
				toast.error(t("validateWebsite"));
				return null;
			}
		}
		if (
			form.location.method !== "virtual" &&
			form.location.coordinates.length === 0
		) {
			toast.error(t("validateLocation"));
			return null;
		}
		return { startsAt, endsAt, capacity, website };
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		const v = validate();
		if (!v) return;
		const loc = form.location;
		const coordinates = loc.method === "virtual" ? [] : loc.coordinates;
		const circleRadius = loc.method === "circle" ? loc.circleRadius : null;

		if (mode === "create") {
			create.mutate({
				title: form.title.trim(),
				label: form.label.trim() || undefined,
				description: form.description.trim() || undefined,
				startsAt: v.startsAt,
				endsAt: v.endsAt ?? undefined,
				communityId: form.communityId,
				locationZoneMethod: loc.method,
				locationText: form.locationText.trim() || undefined,
				coordinates: coordinates.length ? coordinates : undefined,
				circleRadius: circleRadius ?? undefined,
				website: v.website ?? undefined,
				visitorCapacity: v.capacity ?? undefined,
				tags: form.tags.length ? form.tags : undefined,
				isPublic: form.isPublic,
				isPaid: form.isPaid,
			});
		} else if (initial) {
			const communityChanged = form.communityId !== (initial.communityId ?? "");
			update.mutate({
				eventId: initial.id,
				title: form.title.trim(),
				label: form.label.trim() || null,
				description: form.description.trim() || null,
				startsAt: v.startsAt,
				endsAt: v.endsAt,
				communityId: communityChanged ? form.communityId : undefined,
				locationZoneMethod: loc.method,
				locationText: form.locationText.trim() || null,
				coordinates,
				circleRadius,
				website: v.website,
				visitorCapacity: v.capacity,
				tags: form.tags,
				isPublic: form.isPublic,
				isPaid: form.isPaid,
			});
		}
	}

	if (mode === "create" && mine.isError) {
		return (
			<Card>
				<CardContent className="space-y-3 pt-6 text-center">
					<p className="font-medium">{t("communitiesLoadError")}</p>
					<p className="text-sm text-muted-foreground">
						{t("communitiesLoadErrorBody")}
					</p>
					<Button onClick={() => mine.refetch()}>{c("retry")}</Button>
				</CardContent>
			</Card>
		);
	}

	if (noCommunities) {
		return (
			<Card>
				<CardContent className="space-y-3 pt-6 text-center">
					<p className="font-medium">{t("noCommunitiesTitle")}</p>
					<p className="text-sm text-muted-foreground">
						{t("noCommunitiesBody")}
					</p>
					<Button
						asChild
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<Link to={"/communities" as never}>{t("browseCommunities")}</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			<Card>
				<CardContent className="space-y-4 pt-6">
					<div className="space-y-2">
						<Label htmlFor="ev-community">{t("communityLabel")}</Label>
						<Select
							value={form.communityId}
							onValueChange={(v) => setField("communityId", v)}
						>
							<SelectTrigger id="ev-community">
								<SelectValue
									placeholder={
										mine.isPending ? c("loading") : t("communityPlaceholder")
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{options.map((opt) => (
									<SelectItem key={opt.id} value={opt.id}>
										{opt.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{t("communityHelp")}
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-title">{t("titleLabel")}</Label>
						<Input
							id="ev-title"
							value={form.title}
							onChange={(e) => setField("title", e.target.value)}
							maxLength={200}
							placeholder={t("titlePlaceholder")}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-label">{t("taglineLabel")}</Label>
						<Input
							id="ev-label"
							value={form.label}
							onChange={(e) => setField("label", e.target.value)}
							maxLength={200}
							placeholder={t("taglinePlaceholder")}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-desc">{t("descriptionLabel")}</Label>
						<Textarea
							id="ev-desc"
							value={form.description}
							onChange={(e) => setField("description", e.target.value)}
							maxLength={10000}
							rows={5}
							placeholder={t("descriptionPlaceholder")}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="ev-start">{t("startsLabel")}</Label>
						<Input
							id="ev-start"
							type="datetime-local"
							value={form.startsAt}
							onChange={(e) => setField("startsAt", e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-end">{t("endsLabel")}</Label>
						<Input
							id="ev-end"
							type="datetime-local"
							value={form.endsAt}
							onChange={(e) => setField("endsAt", e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-4 pt-6">
					<div>
						<Label>{t("locationLabel")}</Label>
						<p className="text-sm text-muted-foreground">{t("locationHelp")}</p>
					</div>
					<LocationPicker
						value={form.location}
						onChange={(v) => setField("location", v)}
					/>
					<div className="space-y-2">
						<Label htmlFor="ev-locationtext">{t("addressLabel")}</Label>
						<Input
							id="ev-locationtext"
							value={form.locationText}
							onChange={(e) => setField("locationText", e.target.value)}
							maxLength={200}
							placeholder={t("addressPlaceholder")}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-4 pt-6">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="ev-website">{t("websiteLabel")}</Label>
							<Input
								id="ev-website"
								type="url"
								value={form.website}
								onChange={(e) => setField("website", e.target.value)}
								maxLength={500}
								placeholder="https://…"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ev-capacity">{t("capacityLabel")}</Label>
							<Input
								id="ev-capacity"
								type="number"
								min={1}
								value={form.visitorCapacity}
								onChange={(e) => setField("visitorCapacity", e.target.value)}
								placeholder={t("capacityPlaceholder")}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>{t("tagsLabel")}</Label>
						<InputTags
							value={form.tags}
							onChange={(next) =>
								setField(
									"tags",
									typeof next === "function" ? next(form.tags) : next,
								)
							}
							maxLength={40}
							placeholder={t("tagsPlaceholder")}
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
						<div>
							<p className="text-sm font-medium">{t("publicLabel")}</p>
							<p className="text-xs text-muted-foreground">{t("publicHelp")}</p>
						</div>
						<Switch
							checked={form.isPublic}
							onCheckedChange={(v) => setField("isPublic", v)}
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
						<div>
							<p className="text-sm font-medium">{t("paidLabel")}</p>
							<p className="text-xs text-muted-foreground">{t("paidHelp")}</p>
						</div>
						<Switch
							checked={form.isPaid}
							onCheckedChange={(v) => setField("isPaid", v)}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="flex gap-2">
				<Button
					type="submit"
					disabled={submitting}
					className="bg-primary text-primary-foreground hover:bg-primary/90"
				>
					{submitting
						? t("saving")
						: mode === "create"
							? t("createEvent")
							: t("saveChanges")}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={submitting}
					onClick={() => navigate({ to: ".." as never })}
				>
					{c("cancel")}
				</Button>
			</div>
		</form>
	);
}
