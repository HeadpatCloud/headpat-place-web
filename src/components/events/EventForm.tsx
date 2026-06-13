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
						name: currentCommunity.data?.name ?? "Current community",
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
			toast.success("Event created.");
			navigate({ to: `/events/${row.id}` as never });
		},
		onError: (e: Error) => toast.error(e.message),
	});

	const update = useMutation({
		mutationFn: (input: Parameters<typeof client.event.update>[0]) =>
			client.event.update(input),
		onSuccess: (row) => {
			invalidate();
			toast.success("Event saved.");
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
			toast.error("Give the event a title.");
			return null;
		}
		if (!form.communityId) {
			toast.error("Select a community for this event.");
			return null;
		}
		if (!form.startsAt) {
			toast.error("Pick a start date and time.");
			return null;
		}
		const startsAt = new Date(form.startsAt);
		const endsAt = form.endsAt ? new Date(form.endsAt) : null;
		if (endsAt && endsAt < startsAt) {
			toast.error("The end can't be before the start.");
			return null;
		}
		let capacity: number | null = null;
		if (form.visitorCapacity.trim()) {
			capacity = Number(form.visitorCapacity);
			if (!Number.isInteger(capacity) || capacity < 1) {
				toast.error("Capacity must be a whole number of at least 1.");
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
				toast.error("Enter a valid website URL.");
				return null;
			}
		}
		if (
			form.location.method !== "virtual" &&
			form.location.coordinates.length === 0
		) {
			toast.error("Draw the event's location on the map, or set it to Online.");
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
					<p className="font-medium">Couldn't load your communities</p>
					<p className="text-sm text-muted-foreground">
						Something went wrong fetching the communities you run. Try again.
					</p>
					<Button onClick={() => mine.refetch()}>Retry</Button>
				</CardContent>
			</Card>
		);
	}

	if (noCommunities) {
		return (
			<Card>
				<CardContent className="space-y-3 pt-6 text-center">
					<p className="font-medium">You don't run a community yet</p>
					<p className="text-sm text-muted-foreground">
						Events belong to a community. Create or help run one, then come back
						to host an event.
					</p>
					<Button
						asChild
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<Link to={"/communities" as never}>Browse communities</Link>
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
						<Label htmlFor="ev-community">Community</Label>
						<Select
							value={form.communityId}
							onValueChange={(v) => setField("communityId", v)}
						>
							<SelectTrigger id="ev-community">
								<SelectValue
									placeholder={
										mine.isPending ? "Loading…" : "Select a community"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{options.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							The event is hosted under this community.
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-title">Title</Label>
						<Input
							id="ev-title"
							value={form.title}
							onChange={(e) => setField("title", e.target.value)}
							maxLength={200}
							placeholder="Fur the love of art"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-label">Tagline</Label>
						<Input
							id="ev-label"
							value={form.label}
							onChange={(e) => setField("label", e.target.value)}
							maxLength={200}
							placeholder="A short one-liner shown under the title"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-desc">Description</Label>
						<Textarea
							id="ev-desc"
							value={form.description}
							onChange={(e) => setField("description", e.target.value)}
							maxLength={10000}
							rows={5}
							placeholder="What's happening, who's it for, what to bring…"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="ev-start">Starts</Label>
						<Input
							id="ev-start"
							type="datetime-local"
							value={form.startsAt}
							onChange={(e) => setField("startsAt", e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="ev-end">Ends (optional)</Label>
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
						<Label>Location</Label>
						<p className="text-sm text-muted-foreground">
							Pick how attendees find the event. Drawn areas show up on the map.
						</p>
					</div>
					<LocationPicker
						value={form.location}
						onChange={(v) => setField("location", v)}
					/>
					<div className="space-y-2">
						<Label htmlFor="ev-locationtext">Address / venue</Label>
						<Input
							id="ev-locationtext"
							value={form.locationText}
							onChange={(e) => setField("locationText", e.target.value)}
							maxLength={200}
							placeholder="Venue name or full address"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="space-y-4 pt-6">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="ev-website">Website</Label>
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
							<Label htmlFor="ev-capacity">Capacity (optional)</Label>
							<Input
								id="ev-capacity"
								type="number"
								min={1}
								value={form.visitorCapacity}
								onChange={(e) => setField("visitorCapacity", e.target.value)}
								placeholder="No limit"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Tags</Label>
						<InputTags
							value={form.tags}
							onChange={(next) =>
								setField(
									"tags",
									typeof next === "function" ? next(form.tags) : next,
								)
							}
							maxLength={40}
							placeholder="Add a tag, press Enter"
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
						<div>
							<p className="text-sm font-medium">Public event</p>
							<p className="text-xs text-muted-foreground">
								Anyone can find it. Off means only your community sees it.
							</p>
						</div>
						<Switch
							checked={form.isPublic}
							onCheckedChange={(v) => setField("isPublic", v)}
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
						<div>
							<p className="text-sm font-medium">Paid event</p>
							<p className="text-xs text-muted-foreground">
								Marks the event as paid entry.
							</p>
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
						? "Saving…"
						: mode === "create"
							? "Create event"
							: "Save changes"}
				</Button>
				<Button
					type="button"
					variant="outline"
					disabled={submitting}
					onClick={() => navigate({ to: ".." as never })}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
