import { useQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocale, useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";
import { AreaPickerDialog } from "./AreaPickerDialog";
import {
	currentPosition,
	GeolocationError,
	type LatLng,
	ownPosition,
	rememberPickedPosition,
	useInvalidateNearby,
	useNearbyStatus,
} from "./nearby";

const HOUR = 60 * 60 * 1000;
const DURATIONS = {
	"1h": HOUR,
	"4h": 4 * HOUR,
	"24h": 24 * HOUR,
	forever: null,
} as const;
type Duration = keyof typeof DURATIONS;

type Precision = "precise" | "rough";

type Props = {
	// the map passes these to offer the layer switch; the nearby page doesn't
	showLayer?: boolean;
	onShowLayerChange?: (v: boolean) => void;
};

export function NearbyPanel({ showLayer, onShowLayerChange }: Props) {
	const t = useTranslations("nearby");
	const locale = useLocale();
	const status = useNearbyStatus(true);
	const invalidate = useInvalidateNearby();
	const [open, setOpen] = useState(false);
	const events = useQuery({
		...orpc.nearby.events.queryOptions({ input: {} }),
		enabled: open,
	});
	const [scope, setScope] = useState<string>("open");
	const [duration, setDuration] = useState<Duration>("4h");
	const [reciprocal, setReciprocal] = useState(false);
	const [precision, setPrecision] = useState<Precision>("rough");
	const [busy, setBusy] = useState(false);
	// the area picker, plus the precision to apply when it was opened from a
	// precision change that couldn't get a fix
	const [pickerOpen, setPickerOpen] = useState(false);
	const [pendingPrecision, setPendingPrecision] = useState<Precision | null>(
		null,
	);
	const ids = {
		layer: useId(),
		reciprocal: useId(),
		scope: useId(),
		precision: useId(),
	};

	const visible = status.data?.visible === true;
	const fmt = (d: Date | string) =>
		new Date(d).toLocaleString(locale, {
			weekday: "short",
			hour: "2-digit",
			minute: "2-digit",
		});

	function openPicker(nextPrecision: Precision | null = null) {
		setPendingPrecision(nextPrecision);
		setOpen(false);
		setPickerOpen(true);
	}

	/** Runs an action and reports how it went. When the browser can't give a
	 *  position, the error toast offers the map picker instead. */
	async function run(
		action: () => Promise<unknown>,
		nextPrecision: Precision | null = null,
	): Promise<boolean> {
		setBusy(true);
		try {
			await action();
			await invalidate();
			return true;
		} catch (e) {
			if (e instanceof GeolocationError) {
				toast.error(t(`geo.${e.reason}`), {
					action: {
						label: t("pickOnMap"),
						onClick: () => openPicker(nextPrecision),
					},
				});
			} else {
				toast.error(t("error"));
			}
			return false;
		} finally {
			setBusy(false);
		}
	}

	const enableFromForm = (pos: LatLng) => {
		const ms = DURATIONS[duration];
		return client.nearby.enable({
			...pos,
			scope: scope === "open" ? "open" : "event",
			eventId: scope === "open" ? undefined : scope,
			expiresAt: ms === null ? null : new Date(Date.now() + ms).toISOString(),
			reciprocalOnly: reciprocal,
			precision,
		});
	};

	// Re-enables at a new spot or precision with everything else kept as it is.
	const reEnable = async (pos: LatLng, next: Precision) => {
		const s = status.data;
		if (!s?.visible) return;
		await client.nearby.enable({
			...pos,
			scope: s.scope,
			eventId: s.eventId ?? undefined,
			expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString() : null,
			reciprocalOnly: s.reciprocalOnly,
			precision: next,
		});
	};

	const goVisible = () =>
		run(async () => {
			const pos = await currentPosition();
			await enableFromForm(pos);
			// a real fix works here, so stop reusing an older hand-picked spot
			rememberPickedPosition(null);
		});

	// Changing precision needs a position to snap to the new cell size: the
	// hand-picked spot if there is one, otherwise a fresh fix.
	const changePrecision = (next: Precision) =>
		run(async () => {
			const pos = await ownPosition();
			await reEnable(pos, next);
		}, next);

	const confirmPickedSpot = async (pos: LatLng) => {
		const s = status.data;
		const ok = await run(async () => {
			if (s?.visible) await reEnable(pos, pendingPrecision ?? s.precision);
			else await enableFromForm(pos);
			rememberPickedPosition(pos);
		});
		if (ok) setPickerOpen(false);
	};

	const precisionSelect = (
		value: Precision,
		onChange: (v: Precision) => void,
	) => (
		<div className="space-y-1.5">
			<Label htmlFor={ids.precision}>{t("howExact")}</Label>
			<Select
				value={value}
				onValueChange={(v) => onChange(v === "precise" ? "precise" : "rough")}
				disabled={busy}
			>
				<SelectTrigger id={ids.precision}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="rough">{t("precisionRough")}</SelectItem>
					<SelectItem value="precise">{t("precisionPrecise")}</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);

	const durationLabel = (d: Duration) =>
		d === "forever"
			? t(scope === "open" ? "duration.forever" : "duration.eventEnd")
			: t(`duration.${d}`);

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant={visible ? "default" : "secondary"}
						size="sm"
						className="shadow-md"
					>
						<UsersIcon className="size-4" />
						{visible ? t("buttonVisible") : t("button")}
					</Button>
				</PopoverTrigger>
				<PopoverContent align="end" className="w-80 space-y-4">
					<div>
						<p className="font-semibold">{t("title")}</p>
						<p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
					</div>

					{onShowLayerChange ? (
						<div className="flex items-center justify-between gap-3 border-b border-border pb-4">
							<Label htmlFor={ids.layer}>{t("showLayer")}</Label>
							<Switch
								id={ids.layer}
								checked={showLayer ?? true}
								onCheckedChange={onShowLayerChange}
							/>
						</div>
					) : null}

					<div>
						{status.data?.visible ? (
							<div className="space-y-3">
								<p className="text-sm">
									{status.data.scope === "event"
										? t("visibleEvent", { event: status.data.eventTitle ?? "" })
										: t("visibleOpen")}
								</p>
								<p className="text-xs text-muted-foreground">
									{(() => {
										const ends = [
											status.data.expiresAt,
											status.data.eventEndsAt,
										]
											.filter((d): d is Date => !!d)
											.map((d) => new Date(d))
											.sort((a, b) => a.getTime() - b.getTime())[0];
										return ends
											? t("until", { time: fmt(ends) })
											: t("untilOff");
									})()}
								</p>
								{precisionSelect(status.data.precision, changePrecision)}
								<div className="flex items-center justify-between gap-3">
									<Label htmlFor={ids.reciprocal} className="font-normal">
										{t("reciprocal")}
									</Label>
									<Switch
										id={ids.reciprocal}
										checked={status.data.reciprocalOnly}
										disabled={busy}
										onCheckedChange={(v) =>
											run(() =>
												client.nearby.updateSettings({ reciprocalOnly: v }),
											)
										}
									/>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="w-full"
									disabled={busy}
									onClick={() => openPicker()}
								>
									{t("moveOnMap")}
								</Button>
								<Button
									variant="outline"
									className="w-full"
									disabled={busy}
									onClick={() =>
										run(async () => {
											await client.nearby.disable({});
											rememberPickedPosition(null);
										})
									}
								>
									{t("stop")}
								</Button>
							</div>
						) : (
							<div className="space-y-3">
								<div className="space-y-1.5">
									<Label htmlFor={ids.scope}>{t("whoSees")}</Label>
									<Select
										value={scope}
										onValueChange={(v) => {
											setScope(v);
											// 24h only exists for open scope
											if (v !== "open" && duration === "24h") setDuration("4h");
										}}
									>
										<SelectTrigger id={ids.scope}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="open">{t("scopeOpen")}</SelectItem>
											{(events.data ?? []).map((e) => (
												<SelectItem key={e.id} value={e.id}>
													{t("scopeEvent", { event: e.title })}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										{scope === "open" ? t("audienceOpen") : t("audienceEvent")}
									</p>
								</div>
								{precisionSelect(precision, setPrecision)}
								<p className="text-xs text-muted-foreground">
									{precision === "precise"
										? t("fuzzPrecise")
										: scope === "open"
											? t("fuzzOpen")
											: t("fuzzEvent")}
								</p>
								<div className="space-y-1.5">
									<Label>{t("howLong")}</Label>
									<Select
										value={duration}
										onValueChange={(v) => setDuration(v as Duration)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{(Object.keys(DURATIONS) as Duration[])
												.filter((d) => scope === "open" || d !== "24h")
												.map((d) => (
													<SelectItem key={d} value={d}>
														{durationLabel(d)}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center justify-between gap-3">
									<Label htmlFor={ids.reciprocal} className="font-normal">
										{t("reciprocal")}
									</Label>
									<Switch
										id={ids.reciprocal}
										checked={reciprocal}
										onCheckedChange={setReciprocal}
									/>
								</div>
								<Button className="w-full" disabled={busy} onClick={goVisible}>
									{t("start")}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="w-full"
									disabled={busy}
									onClick={() => openPicker()}
								>
									{t("pickOnMap")}
								</Button>
								<p className="text-xs text-muted-foreground">{t("privacy")}</p>
							</div>
						)}
					</div>
				</PopoverContent>
			</Popover>
			<AreaPickerDialog
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				onPick={confirmPickedSpot}
				busy={busy}
			/>
		</>
	);
}
