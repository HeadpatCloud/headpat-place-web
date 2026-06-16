import { SettingsIcon } from "lucide-react";
import { usePresence } from "@/components/contexts/PresenceProvider";
import { useUser } from "@/components/contexts/UserContext";
import { StatusDot } from "@/components/StatusDot";
import { StorageImage } from "@/components/StorageImage";
import { UserStatusMenu } from "@/components/UserStatusMenu";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";

function initials(name: string | null | undefined, fallback: string): string {
	const source = name?.trim() || fallback;
	return source.charAt(0).toUpperCase();
}

export function SidebarUserPanel() {
	const t = useTranslations("chatUi");
	const { userData, current } = useUser();
	const { presenceOf } = usePresence();
	const meId = current?.$id;
	const meName = userData?.displayName || current?.name || t("youFallback");

	return (
		<div className="flex h-15 shrink-0 items-center gap-1 border-t border-border bg-card px-2">
			<UserStatusMenu>
				<button
					type="button"
					className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted"
				>
					<span className="relative shrink-0">
						<StorageImage
							kind="avatar"
							fileId={userData?.avatarId}
							variant="md"
							className="size-8.5 rounded-full object-cover bg-muted"
							fallback={
								<div className="flex size-8.5 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold leading-none text-primary">
									{initials(meName, "Y")}
								</div>
							}
						/>
						{meId ? (
							<StatusDot
								userId={meId}
								className="absolute -bottom-0.5 -right-0.5 border-card"
							/>
						) : null}
					</span>
					<div className="min-w-0 flex-1 leading-tight">
						<div className="truncate text-sm font-semibold text-foreground">
							{meName}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							{(meId && presenceOf(meId)?.customStatus) ||
								(meId
									? (presenceOf(meId)?.status ?? t("statusOffline"))
									: t("statusOffline"))}
						</div>
					</div>
				</button>
			</UserStatusMenu>
			<Link
				to="/account"
				className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				aria-label={t("settings")}
			>
				<SettingsIcon className="size-4" />
			</Link>
		</div>
	);
}
