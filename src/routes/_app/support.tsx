import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/support")({
	component: SupportPage,
});

function SupportPage() {
	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold tracking-tight">
					Help &amp; support
				</h1>
				<p className="mt-1 text-muted-foreground">
					Reach us however suits you — or open a ticket and we'll follow up.
				</p>
			</div>

			<Card className="border-primary/30 bg-primary/5">
				<CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="flex items-center gap-2 font-semibold">
							<MessageSquarePlus className="size-5 text-primary" />
							Open a support ticket
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Track the conversation and attach screenshots or files.
						</p>
					</div>
					<div className="flex shrink-0 gap-2">
						<Button asChild variant="outline">
							<Link to={"/account/tickets" as never}>Your tickets</Link>
						</Button>
						<Button asChild>
							<Link
								to={"/account/tickets" as never}
								search={{ new: true } as never}
							>
								New ticket <ArrowRight className="size-4" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Other ways to reach us</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<div>
						<span className="font-medium">Discord</span>
						<p className="text-muted-foreground">
							Real-time help and community chat:{" "}
							<a
								className="text-link hover:underline"
								href="https://discord.gg/EaQTEKRg2A"
							>
								discord.gg/EaQTEKRg2A
							</a>
						</p>
					</div>
					<div>
						<span className="font-medium">E-mail</span>
						<p className="text-muted-foreground">
							Drop us a line at{" "}
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
							File bugs and contribute at{" "}
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
