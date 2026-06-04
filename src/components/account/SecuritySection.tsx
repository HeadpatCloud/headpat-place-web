import { ActiveSessions } from "./ActiveSessions";
import { TwoFactorPanel } from "./TwoFactorPanel";

export function SecuritySection() {
	return (
		<div className="space-y-8">
			<div>
				<h3 className="mb-3 text-sm font-semibold">
					Two-factor authentication
				</h3>
				<TwoFactorPanel />
			</div>
			<div>
				<h3 className="mb-3 text-sm font-semibold">Active sessions</h3>
				<ActiveSessions />
			</div>
		</div>
	);
}
