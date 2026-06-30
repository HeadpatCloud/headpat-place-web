import { useQuery } from "@tanstack/react-query";
import type * as React from "react";
import { useState } from "react";
import { Pager } from "@/components/Pager";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useDateFormat } from "@/lib/datetime";
import { useTranslations } from "@/lib/i18n";
import { orpc } from "@/lib/orpc";
import { cn } from "@/lib/utils";

const CATEGORIES = [
	"account",
	"email",
	"twofactor",
	"session",
	"role",
	"ban",
	"profile",
] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLOR: Record<Category, string> = {
	account: "bg-blue-500/15 text-blue-500",
	email: "bg-violet-500/15 text-violet-500",
	twofactor: "bg-amber-500/15 text-amber-500",
	session: "bg-emerald-500/15 text-emerald-500",
	role: "bg-sky-500/15 text-sky-500",
	ban: "bg-red-500/15 text-red-500",
	profile: "bg-muted text-muted-foreground",
};

type AuditItem = {
	id: string;
	action: string;
	category: string;
	metadata: Record<string, unknown> | null;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string | Date;
	actorUserId: string | null;
	actorName: string | null;
	actorProfileUrl: string | null;
};

export function UserAuditLog({
	userId,
	trigger,
}: {
	userId: string;
	trigger: React.ReactNode;
}) {
	const t = useTranslations("adminPanel");
	const c = useTranslations("common");
	const fmt = useDateFormat();
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<Category | null>(null);
	const [page, setPage] = useState(1);

	const q = useQuery({
		...orpc.adminUser.auditLog.queryOptions({
			input: {
				userId,
				category: category ?? undefined,
				page,
				pageSize: 20,
			},
		}),
		enabled: open,
	});

	function actionLabel(action: string): string {
		const key = `audit_${action.replace(".", "_")}`;
		const label = t(key);
		// fall back to the raw action if no translation exists
		return label === key ? action : label;
	}

	function details(e: AuditItem): string | null {
		const m = e.metadata ?? {};
		if (e.action === "session.created") {
			return [e.userAgent?.slice(0, 60), e.ipAddress]
				.filter(Boolean)
				.join(" · ");
		}
		if (e.action === "ban.banned" && m.reason) return String(m.reason);
		if (e.action === "profile.updated" && Array.isArray(m.fields)) {
			return (m.fields as string[]).join(", ");
		}
		if (e.action === "session.revokedAll" && typeof m.count === "number") {
			return t("auditCount", { count: m.count });
		}
		if (
			(e.action === "email.verified" || e.action.startsWith("twofactor.")) &&
			m.forced
		) {
			return t("auditForced");
		}
		return null;
	}

	const items = (q.data?.items ?? []) as AuditItem[];

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("auditLog")}</DialogTitle>
				</DialogHeader>

				<div className="flex flex-wrap gap-1.5">
					<FilterChip
						active={category === null}
						onClick={() => {
							setCategory(null);
							setPage(1);
						}}
					>
						{t("auditAll")}
					</FilterChip>
					{CATEGORIES.map((cat) => (
						<FilterChip
							key={cat}
							active={category === cat}
							onClick={() => {
								setCategory(cat);
								setPage(1);
							}}
						>
							{t(`auditCat_${cat}`)}
						</FilterChip>
					))}
				</div>

				<div className="max-h-[55vh] min-h-32 space-y-2 overflow-y-auto">
					{q.isPending ? (
						<p className="text-sm text-muted-foreground">{c("loading")}</p>
					) : items.length === 0 ? (
						<p className="text-sm text-muted-foreground">{t("auditEmpty")}</p>
					) : (
						items.map((e) => {
							const d = details(e);
							return (
								<div
									key={e.id}
									className="rounded-md border border-border p-2.5 text-sm"
								>
									<div className="flex items-center justify-between gap-2">
										<div className="flex min-w-0 items-center gap-2">
											<span
												className={cn(
													"shrink-0 rounded px-1.5 py-0.5 text-xs font-medium",
													CATEGORY_COLOR[e.category as Category] ??
														"bg-muted text-muted-foreground",
												)}
											>
												{t(`auditCat_${e.category}`)}
											</span>
											<span className="truncate font-medium">
												{actionLabel(e.action)}
											</span>
										</div>
										<span className="shrink-0 text-xs text-muted-foreground">
											{fmt.date(e.createdAt)}
										</span>
									</div>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{e.actorUserId
											? t("auditBy", {
													name:
														e.actorName || e.actorProfileUrl || e.actorUserId,
												})
											: t("auditBySelf")}
										{d ? ` · ${d}` : ""}
									</p>
								</div>
							);
						})
					)}
				</div>

				{q.data ? (
					<Pager
						page={q.data.page}
						total={q.data.total}
						pageSize={q.data.pageSize}
						onPageChange={setPage}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function FilterChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Button
			type="button"
			size="sm"
			variant={active ? "default" : "outline"}
			className="h-7 px-2.5 text-xs"
			onClick={onClick}
		>
			{children}
		</Button>
	);
}
