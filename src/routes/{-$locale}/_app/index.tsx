import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { FadeIn } from "@/components/FadeIn";
import { StorageImage } from "@/components/StorageImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { useDateFormat } from "@/lib/datetime";
import { orpc } from "@/lib/orpc";

export const Route = createFileRoute("/{-$locale}/_app/")({ component: Landing });

function Landing() {
	const { data: session } = useSession();
	const fmt = useDateFormat();
	const communities = useQuery(
		orpc.community.list.queryOptions({ input: { pageSize: 3 } }),
	);
	const users = useQuery(
		orpc.profile.list.queryOptions({ input: { pageSize: 3 } }),
	);
	const events = useQuery(
		orpc.event.upcoming.queryOptions({ input: { limit: 3 } }),
	);
	const topCommunities = (communities.data?.items ?? []).slice(0, 3);
	const topUsers = (users.data?.items ?? []).slice(0, 3);
	const upcoming = events.data ?? [];

	return (
		<main className="space-y-8">
			<section className="bg-sunset-hero relative overflow-hidden rounded-2xl p-8 text-white">
				<h1 className="text-3xl font-extrabold tracking-tight">
					{session?.user
						? `Welcome back, ${session.user.name || "friend"} ✨`
						: "Welcome to Headpat"}
				</h1>
				<p className="mt-2 max-w-md text-white/85">
					Explore communities, share to the gallery, and keep up with friends.
				</p>
				<Button
					asChild
					className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
				>
					<Link to={(session?.user ? "/gallery" : "/login") as never}>
						{session?.user ? "Browse gallery" : "Log in"}
					</Link>
				</Button>
			</section>

			{upcoming.length > 0 ? (
				<section>
					<h2 className="mb-3 text-xl font-bold">Upcoming events</h2>
					<div className="grid gap-4 sm:grid-cols-3">
						{upcoming.map((e, i) => {
							const location =
								e.locationText ||
								(e.locationZoneMethod === "virtual" ? "Online" : "");
							const meta = [e.community?.name, location]
								.filter(Boolean)
								.join(" · ");
							return (
								<Link key={e.id} to={`/events/${e.id}` as never}>
									<FadeIn index={i}>
										<Card className="card-hover">
											<CardContent className="flex items-center gap-3 pt-6">
												<div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/15 leading-none text-primary">
													<span className="text-[10px] font-bold tracking-wide">
														{fmt
															.date(e.startsAt, { month: "short" })
															.toUpperCase()}
													</span>
													<span className="text-xl font-extrabold">
														{fmt.date(e.startsAt, { day: "numeric" })}
													</span>
												</div>
												<div className="min-w-0">
													<p className="truncate font-semibold">{e.title}</p>
													<p className="truncate text-xs text-muted-foreground">
														{meta}
													</p>
												</div>
											</CardContent>
										</Card>
									</FadeIn>
								</Link>
							);
						})}
					</div>
				</section>
			) : null}

			<section>
				<h2 className="mb-3 text-xl font-bold">Popular communities</h2>
				<div className="grid gap-4 sm:grid-cols-3">
					{topCommunities.map((c, i) => (
						<Link key={c.id} to={`/community/${c.id}` as never}>
							<FadeIn index={upcoming.length + i}>
								<Card className="card-hover">
									<CardContent className="flex items-center gap-3 pt-6">
										<StorageImage
											kind="community-avatar"
											fileId={c.avatarFileId}
											variant="sm"
											className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover bg-muted"
											fallback={
												<div className="h-9 w-9 shrink-0 rounded-lg border border-border bg-muted" />
											}
										/>
										<div className="min-w-0">
											<p className="truncate font-semibold">{c.name}</p>
											<p className="text-xs text-muted-foreground">
												{c.followersCount} followers
											</p>
										</div>
									</CardContent>
								</Card>
							</FadeIn>
						</Link>
					))}
				</div>
			</section>

			<section>
				<h2 className="mb-3 text-xl font-bold">Suggested users</h2>
				<div className="grid gap-4 sm:grid-cols-3">
					{topUsers.map((u, i) => (
						<Link key={u.userId} to={`/user/${u.profileUrl}` as never}>
							<FadeIn index={upcoming.length + topCommunities.length + i}>
								<Card className="card-hover">
									<CardContent className="flex items-center gap-3 pt-6">
										<StorageImage
											kind="avatar"
											fileId={u.avatarFileId}
											variant="sm"
											className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover bg-muted"
											fallback={
												<div className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted" />
											}
										/>
										<div className="min-w-0">
											<p className="truncate font-semibold">
												{u.displayName || u.name || u.profileUrl}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												@{u.profileUrl}
											</p>
										</div>
									</CardContent>
								</Card>
							</FadeIn>
						</Link>
					))}
				</div>
			</section>
		</main>
	);
}
