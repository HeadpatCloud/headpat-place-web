import { useQuery } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import { useAuthState } from "@/components/contexts/SessionHint";
import { useUser } from "@/components/contexts/UserContext";
import { useStorageUrl } from "@/components/StorageImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../ui/button";

export function HeaderActions() {
	const t = useTranslations("commonUi");
	const { userData } = useUser();
	const auth = useAuthState();
	const avatarUrl = useStorageUrl(
		"avatar",
		userData?.avatarId ?? auth.avatar,
		"md",
	).data?.url;
	const unread = useQuery({
		...orpc.notification.unreadCount.queryOptions({ input: undefined }),
		enabled: auth.signedIn && !auth.pending,
	});
	const hasUnread = (unread.data?.count ?? 0) > 0;

	return (
		<div className="flex items-center gap-1">
			<LanguageSwitcher />
			<ThemeToggle />
			{auth.signedIn ? (
				<>
					<Button
						asChild
						variant="ghost"
						size="icon"
						className="relative rounded-full"
					>
						<Link
							to="/notifications"
							aria-label={
								hasUnread
									? `${t("notifications")}, ${unread.data?.count}`
									: t("notifications")
							}
						>
							<BellIcon className="size-5" />
							{hasUnread ? (
								<span className="absolute top-2 right-2.5 size-2.5 rounded-full border-2 border-card bg-destructive" />
							) : null}
						</Link>
					</Button>
					<Link
						to="/profile"
						aria-label={t("account")}
						className="ml-1 rounded-full"
					>
						<Avatar className="size-10">
							<AvatarImage
								src={avatarUrl}
								alt={userData?.displayName || userData?.$id || ""}
							/>
							<AvatarFallback>
								{(userData?.displayName || auth.name).charAt(0) || "HI"}
							</AvatarFallback>
						</Avatar>
					</Link>
				</>
			) : null}
		</div>
	);
}
