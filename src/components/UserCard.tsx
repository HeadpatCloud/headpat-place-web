import { Link } from "@tanstack/react-router";
import { StatusDot } from "@/components/StatusDot";
import { StorageImage } from "@/components/StorageImage";
import { Card } from "@/components/ui/card";

export type UserSummary = {
	userId: string;
	profileUrl: string;
	displayName: string | null;
	name: string | null;
	avatarFileId: string | null;
};

export function UserCard({
	user,
	trailing,
	to,
}: {
	user: UserSummary;
	trailing?: React.ReactNode;
	to?: string;
}) {
	return (
		<Link to={(to ?? `/user/${user.profileUrl}`) as never} className="block">
			<Card className="card-hover flex flex-row items-center gap-3 p-3">
				<span className="relative inline-block shrink-0">
					<StorageImage
						kind="avatar"
						fileId={user.avatarFileId}
						variant="sm"
						className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover bg-muted"
						fallback={
							<div className="h-11 w-11 shrink-0 rounded-lg border border-border bg-muted" />
						}
					/>
					<StatusDot
						userId={user.userId}
						className="absolute bottom-0 right-0"
					/>
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold">
						{user.displayName || user.name || user.profileUrl}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						@{user.profileUrl}
					</p>
				</div>
				{trailing}
			</Card>
		</Link>
	);
}
