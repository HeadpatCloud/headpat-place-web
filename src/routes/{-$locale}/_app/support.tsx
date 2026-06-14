import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useTranslations,
} from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/support")({
	component: SupportPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.supportTitle"),
			path: "/support",
			locale,
		});
	},
});

function SupportPage() {
	const t = useTranslations("miscPages");
	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold tracking-tight">
					{t("supportTitle")}
				</h1>
				<p className="mt-1 text-muted-foreground">{t("supportSubtitle")}</p>
			</div>

			<Card className="border-primary/30 bg-primary/5">
				<CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
					<div>
						{/* globals.css sizes bare h2 at 1.875rem; ! beats that unlayered rule */}
						<h2 className="flex items-center gap-2 text-lg! font-semibold">
							<MessageSquarePlus className="size-5 text-primary" />
							{t("supportOpenTicket")}
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("supportTicketDesc")}
						</p>
					</div>
					<div className="flex shrink-0 gap-2">
						<Button asChild variant="outline">
							<Link to={"/account/tickets" as never}>
								{t("supportYourTickets")}
							</Link>
						</Button>
						<Button asChild>
							<Link
								to={"/account/tickets" as never}
								search={{ new: true } as never}
							>
								{t("supportNewTicket")} <ArrowRight className="size-4" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">{t("supportOtherWays")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<div>
						<span className="font-medium">Discord</span>
						<p className="text-muted-foreground">
							{t("supportDiscordDesc")}{" "}
							<a
								className="text-link hover:underline"
								href="https://discord.gg/EaQTEKRg2A"
							>
								discord.gg/EaQTEKRg2A
							</a>
						</p>
					</div>
					<div>
						<span className="font-medium">{t("supportEmailLabel")}</span>
						<p className="text-muted-foreground">
							{t("supportEmailDesc")}{" "}
							<a
								className="text-link hover:underline"
								href="mailto:help@headpat.place"
							>
								help@headpat.place
							</a>
						</p>
					</div>
					<div>
						<span className="font-medium">GitHub</span>
						<p className="text-muted-foreground">
							{t("supportGithubDesc")}{" "}
							<a
								className="text-link hover:underline"
								href="https://github.com/headpatcloud"
							>
								github.com/headpatcloud
							</a>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
