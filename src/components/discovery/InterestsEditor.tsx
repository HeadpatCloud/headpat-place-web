import type { LOOKING_FOR } from "@backend/lib/discovery";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { client, orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";
import { TagInput } from "./TagInput";

type LookingFor = (typeof LOOKING_FOR)[number];

export function ToggleChips<K extends string>({
	options,
	value,
	onChange,
	label,
}: {
	options: readonly K[];
	value: K[];
	onChange: (v: K[]) => void;
	label: (key: K) => string;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{options.map((key) => {
				const on = value.includes(key);
				return (
					<button
						key={key}
						type="button"
						aria-pressed={on}
						onClick={() =>
							onChange(on ? value.filter((v) => v !== key) : [...value, key])
						}
						className={cn(
							"rounded-full border px-3 py-1 text-sm transition-colors",
							on
								? "border-primary bg-primary/15 text-link"
								: "border-border text-muted-foreground hover:bg-muted",
						)}
					>
						{label(key)}
					</button>
				);
			})}
		</div>
	);
}

export function InterestsEditor() {
	const t = useTranslations("discovery");
	const qc = useQueryClient();
	const mine = useQuery(orpc.discovery.mine.queryOptions({ input: {} }));
	const options = useQuery(orpc.discovery.options.queryOptions());
	const [interests, setInterests] = useState<string[]>([]);
	const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!mine.data) return;
		setInterests(mine.data.interests);
		setLookingFor(mine.data.lookingFor);
	}, [mine.data]);

	const save = async () => {
		setSaving(true);
		try {
			await client.discovery.setInterests({ interests });
			await client.discovery.setLookingFor({ lookingFor });
			await qc.invalidateQueries({ queryKey: orpc.discovery.key() });
			toast.success(t("saved"));
		} catch (e) {
			toast.error((e as Error).message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<p className="text-sm font-semibold">{t("interestsTitle")}</p>
				<p className="text-sm text-muted-foreground">{t("interestsHint")}</p>
				<TagInput
					kind="interest"
					value={interests}
					onChange={setInterests}
					max={options.data?.maxInterests ?? 20}
					placeholder={t("interestsPlaceholder")}
					label={t("interestsTitle")}
				/>
			</div>
			<div className="space-y-2">
				<p className="text-sm font-semibold">{t("lookingForTitle")}</p>
				<ToggleChips
					options={options.data?.lookingFor ?? []}
					value={lookingFor}
					onChange={setLookingFor}
					label={(k) => t(`lookingFor.${k}`)}
				/>
			</div>
			<Button onClick={save} disabled={saving || mine.isPending}>
				{t("save")}
			</Button>
		</div>
	);
}
