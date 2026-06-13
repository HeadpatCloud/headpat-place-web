import { useTranslations } from "@/lib/i18n";
import { Panel, ToggleRow } from "./Section";
import type { AccountProfile } from "./types";

type Props = {
	profile: AccountProfile;
	onChange: (field: "indexingEnabled" | "nsfwEnabled", value: boolean) => void;
};

export function PrivacySection({ profile, onChange }: Props) {
	const t = useTranslations("accountPages");
	return (
		<Panel className="divide-y divide-border px-5">
			<ToggleRow
				title={t("indexingTitle")}
				description={t("indexingDescription")}
				checked={profile.indexingEnabled}
				onChange={(v) => onChange("indexingEnabled", v)}
			/>
			<ToggleRow
				title={t("nsfwTitle")}
				description={t("nsfwDescription")}
				checked={profile.nsfwEnabled}
				onChange={(v) => onChange("nsfwEnabled", v)}
			/>
		</Panel>
	);
}
