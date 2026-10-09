import {
	CalendarIcon,
	HeartHandshakeIcon,
	LayoutPanelLeftIcon,
	MapIcon,
} from "lucide-react";
import { FadeIn } from "@/components/FadeIn";
import { SECTION, SECTION_LINK, SECTION_TITLE } from "@/components/home/styles";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { StorageImage } from "@/components/StorageImage";
import { useTranslations } from "@/lib/i18n";
import { LocalizedLink as Link } from "@/lib/localized-nav";

type Community = {
	id: string;
	name: string;
	avatarFileId: string | null;
	followersCount: number;
};
type Person = {
	userId: string;
	profileUrl: string;
	displayName: string | null;
	name?: string | null;
	avatarFileId: string | null;
};
type GalleryItem = { id: string; name: string; fileId: string | null };

export default function HomeSections({
	communities,
	users,
	gallery,
}: {
	communities: Community[];
	users: Person[];
	gallery: GalleryItem[];
}) {
	const t = useTranslations("home");
	const nav = useTranslations("nav");
	const topCommunities = communities;
	const topUsers = users;
	const fresh = gallery;
	const tiles = [
		{
			to: "/gallery",
			icon: LayoutPanelLeftIcon,
			title: nav("gallery"),
			text: t("tileGallery"),
			tint: "bg-primary/10",
		},
		{
			to: "/community",
			icon: HeartHandshakeIcon,
			title: nav("communities"),
			text: t("tileCommunities"),
			tint: "bg-accent/20",
		},
		{
			to: "/events",
			icon: CalendarIcon,
			title: nav("events"),
			text: t("tileEvents"),
			tint: "bg-muted",
		},
		{
			to: "/map",
			icon: MapIcon,
			title: nav("map"),
			text: t("tileMap"),
			tint: "bg-destructive/10",
		},
	];

	return (
		<>
			<section
				aria-label={t("shortcuts")}
				className="grid grid-cols-2 gap-4 lg:grid-cols-4"
			>
				{tiles.map((tile) => (
					<Link
						key={tile.to}
						to={tile.to}
						className={`flex flex-col gap-3 rounded-3xl p-5 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${tile.tint}`}
					>
						<span className="flex size-11 items-center justify-center rounded-2xl bg-card text-link">
							<tile.icon className="size-5.5" />
						</span>
						<span className="font-display text-xl font-semibold">
							{tile.title}
						</span>
						<span className="text-sm font-semibold text-muted-foreground">
							{tile.text}
						</span>
					</Link>
				))}
			</section>

			<section className="grid gap-5 xl:grid-cols-5">
				<div className={`${SECTION} flex flex-col gap-4 xl:col-span-3`}>
					<div className="flex items-center justify-between">
						<h2 className={SECTION_TITLE}>{t("discoverCommunities")}</h2>
						<Link to="/community" className={SECTION_LINK}>
							{t("seeAll")}
						</Link>
					</div>
					<div className="grid grid-cols-2 content-start gap-3.5 sm:grid-cols-3">
						{topCommunities.map((c, i) => (
							<Link key={c.id} to={`/community/${c.id}`}>
								<FadeIn index={i}>
									<div className="flex flex-col gap-3 rounded-2xl bg-background p-4 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
										<StorageImage
											kind="community-avatar"
											fileId={c.avatarFileId}
											variant="sm"
											className="size-13 rounded-2xl bg-muted object-cover"
											fallback={
												<span className="flex size-13 items-center justify-center rounded-2xl bg-primary font-display text-xl font-semibold text-primary-foreground">
													{c.name.charAt(0).toUpperCase()}
												</span>
											}
										/>
										<span>
											<span className="block truncate font-extrabold">
												{c.name}
											</span>
											<span className="block text-sm font-semibold text-muted-foreground">
												{t("followers", { count: c.followersCount })}
											</span>
										</span>
									</div>
								</FadeIn>
							</Link>
						))}
					</div>
				</div>

				<div className={`${SECTION} flex flex-col gap-3.5 xl:col-span-2`}>
					<div className="flex items-center justify-between">
						<h2 className={SECTION_TITLE}>{t("sayHi")}</h2>
						<Link to="/users" className={SECTION_LINK}>
							{t("morePeople")}
						</Link>
					</div>
					{topUsers.map((u, i) => (
						<Link
							key={u.userId}
							to={`/user/${u.profileUrl}`}
							className="rounded-2xl"
						>
							<FadeIn index={i}>
								<div className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted">
									<StorageImage
										kind="avatar"
										fileId={u.avatarFileId}
										variant="sm"
										className="size-11 shrink-0 rounded-full bg-muted object-cover"
										fallback={
											<span className="size-11 shrink-0 rounded-full bg-muted" />
										}
									/>
									<span className="min-w-0">
										<span className="block truncate font-extrabold">
											{u.displayName || u.name || u.profileUrl}
										</span>
										<span className="block truncate text-sm font-semibold text-muted-foreground">
											@{u.profileUrl}
										</span>
									</span>
								</div>
							</FadeIn>
						</Link>
					))}
				</div>
			</section>

			{fresh.length > 0 ? (
				<section className={`${SECTION} flex flex-col gap-4`}>
					<div className="flex items-center justify-between">
						<h2 className={SECTION_TITLE}>{t("freshGallery")}</h2>
						<Link to="/gallery" className={SECTION_LINK}>
							{t("openGallery")}
						</Link>
					</div>
					<div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
						{fresh.map((g) => (
							<Link
								key={g.id}
								to={`/gallery/${g.id}`}
								aria-label={g.name}
								className="block aspect-4/5 overflow-hidden rounded-2xl bg-muted transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
							>
								<ResponsiveImage
									kind="gallery"
									fileId={g.fileId}
									alt={g.name}
									sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw"
									className="size-full object-cover"
								/>
							</Link>
						))}
					</div>
				</section>
			) : null}
		</>
	);
}
