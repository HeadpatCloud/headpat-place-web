import { Panel, ToggleRow } from "./Section";
import type { AccountProfile } from "./types";

type Props = {
	profile: AccountProfile;
	onChange: (field: "indexingEnabled" | "nsfwEnabled", value: boolean) => void;
};

export function PrivacySection({ profile, onChange }: Props) {
	return (
		<Panel className="divide-y divide-border px-5">
			<ToggleRow
				title="Allow profile indexing"
				description="Let search engines and the user discovery page find you."
				checked={profile.indexingEnabled}
				onChange={(v) => onChange("indexingEnabled", v)}
			/>
			<ToggleRow
				title="Show NSFW content"
				description="Reveal posts and gallery items flagged as NSFW."
				checked={profile.nsfwEnabled}
				onChange={(v) => onChange("nsfwEnabled", v)}
			/>
		</Panel>
	);
}
