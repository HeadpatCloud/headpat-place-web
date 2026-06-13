import { useTranslations } from "@/lib/i18n";
import { ActiveSessions } from "./ActiveSessions";
import { TwoFactorPanel } from "./TwoFactorPanel";

export function SecuritySection() {
	const t = useTranslations("accountPages");
	return (
		<div className="space-y-8">
			<div>
				<h3 className="mb-3 text-sm font-semibold">{t("twoFactorHeading")}</h3>
				<TwoFactorPanel />
			</div>
			<div>
				<h3 className="mb-3 text-sm font-semibold">
					{t("activeSessionsHeading")}
				</h3>
				<ActiveSessions />
			</div>
		</div>
	);
}
