import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPage, Empty } from "@/components/admin/AdminPage";
import { Chips, SearchBox } from "@/components/admin/Filters";
import { TableCard, Td, Th, Tr } from "@/components/admin/table";
import { Pager } from "@/components/Pager";
import { StorageImage } from "@/components/StorageImage";
import { Badge } from "@/components/ui/badge";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { orpc } from "@/lib/orpc";
import { useDebounced } from "@/lib/use-debounced";

export const Route = createFileRoute("/{-$locale}/admin/users/")({
	component: UsersList,
});

const pageSize = 20;
type Status = "all" | "banned" | "unverified" | "verified" | "staff";
type Sort = "newest" | "oldest" | "name";

function UsersList() {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<Status>("all");
	const [sort, setSort] = useState<Sort>("newest");
	const [page, setPage] = useState(1);
	const q = useDebounced(search);
	const users = useQuery({
		...orpc.adminUser.list.queryOptions({
			input: { search: q || undefined, status, sort, page, pageSize },
		}),
		placeholderData: keepPreviousData,
	});

	return (
		<AdminPage
			title={t("users")}
			description={
				users.data ? t("resultCount", { count: users.data.total }) : undefined
			}
		>
			<div className="flex flex-wrap items-center gap-3">
				<SearchBox
					value={search}
					onChange={(v) => {
						setSearch(v);
						setPage(1);
					}}
					placeholder={t("searchUsers")}
				/>
				<select
					value={sort}
					onChange={(e) => {
						setSort(e.target.value as Sort);
						setPage(1);
					}}
					aria-label={t("sortName")}
					className="h-11 rounded-full border border-border bg-card px-4 text-sm font-extrabold shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="newest">{t("sortNewest")}</option>
					<option value="oldest">{t("sortOldest")}</option>
					<option value="name">{t("sortName")}</option>
				</select>
			</div>
			<Chips
				value={status}
				onChange={(v) => {
					setStatus(v);
					setPage(1);
				}}
				options={[
					{ value: "all", label: t("usersAll") },
					{ value: "banned", label: t("usersBanned") },
					{ value: "unverified", label: t("usersUnverified") },
					{ value: "verified", label: t("usersVerified") },
					{ value: "staff", label: t("usersStaff") },
				]}
			/>

			{users.isError ? (
				<Empty>{t("noAccess")}</Empty>
			) : users.isPending ? (
				<Empty>{c("loading")}</Empty>
			) : users.data.items.length === 0 ? (
				<Empty>{t("noUsers")}</Empty>
			) : (
				<>
					<TableCard>
						<thead>
							<tr>
								<Th>{t("colUser")}</Th>
								<Th>{t("colEmail")}</Th>
								<Th>{t("colStatus")}</Th>
								<Th>{t("colJoined")}</Th>
							</tr>
						</thead>
						<tbody>
							{users.data.items.map((u) => (
								<Tr key={u.userId}>
									<Td>
										<Link
											to={`/admin/users/${u.userId}`}
											className="flex items-center gap-3"
										>
											<StorageImage
												kind="avatar"
												fileId={u.avatarFileId}
												variant="sm"
												className="size-10 shrink-0 rounded-full bg-muted object-cover"
												fallback={
													<span className="size-10 shrink-0 rounded-full bg-muted" />
												}
											/>
											<span className="min-w-0">
												<span className="block truncate font-extrabold">
													{u.displayName || u.name}
												</span>
												{u.profileUrl ? (
													<span className="block truncate text-xs font-semibold text-muted-foreground">
														@{u.profileUrl}
													</span>
												) : null}
											</span>
										</Link>
									</Td>
									<Td className="max-w-56 truncate text-muted-foreground">
										{u.email}
									</Td>
									<Td>
										<div className="flex flex-wrap gap-1.5">
											{u.banned ? (
												<Badge variant="destructive">{t("bannedBadge")}</Badge>
											) : null}
											{u.emailVerified ? (
												<Badge variant="outline">{t("verifiedBadge")}</Badge>
											) : (
												<Badge variant="secondary">
													{t("unverifiedBadge")}
												</Badge>
											)}
											{u.twoFactorEnabled ? (
												<Badge variant="outline">{t("twoFactorBadge")}</Badge>
											) : null}
										</div>
									</Td>
									<Td className="whitespace-nowrap text-muted-foreground">
										{fmt.date(u.createdAt)}
									</Td>
								</Tr>
							))}
						</tbody>
					</TableCard>
					<Pager
						page={users.data.page}
						total={users.data.total}
						pageSize={users.data.pageSize}
						onPageChange={setPage}
					/>
				</>
			)}
		</AdminPage>
	);
}
