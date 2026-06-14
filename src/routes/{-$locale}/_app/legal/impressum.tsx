import { createFileRoute } from "@tanstack/react-router";
import {
	DEFAULT_LOCALE,
	type Locale,
	translate,
	useTranslations,
} from "@/lib/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/{-$locale}/_app/legal/impressum")({
	component: ImpressumPage,
	head: ({ params }) => {
		const locale = (params as { locale?: Locale }).locale ?? DEFAULT_LOCALE;
		return seo({
			title: translate(locale, "miscPages.impressumTitle"),
			path: "/legal/impressum",
			locale,
		});
	},
});

function ImpressumPage() {
	const t = useTranslations("miscPages");
	return (
		<div>
			<div className="mx-auto max-w-3xl text-base leading-7">
				<h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
					{t("impressumTitle")}
				</h1>
				<br />
				<p>{t("impressumLegalInfo")}</p>
				<br />
				<h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
					{t("impressumContact")}
				</h2>
				<br />
				<p>
					{t("impressumOnRequest")}{" "}
					<a href="mailto:help@headpat.place">help@headpat.place</a>
				</p>
				<br />
				<p>
					<strong>{t("impressumContactInfo")}</strong>
				</p>
				<p>
					{t("impressumEmailLabel")}{" "}
					<a href="mailto:help@headpat.place">help@headpat.place</a>
				</p>
				<p>
					{t("impressumWebsiteLabel")}{" "}
					<a href="https://headpat.place">https://headpat.place</a>
				</p>
				<br />
				<h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
					{t("impressumDisputeTitle")}
				</h2>
				<p>
					{t("impressumDisputeIntro")}{" "}
					<a
						className="text-link hover:text-link/80"
						href="https://ec.europa.eu/consumers/odr/"
						target="_blank"
						rel="noreferrer"
					>
						https://ec.europa.eu/consumers/odr/
					</a>
					<br />
					<br />
					{t("impressumDisputeStatement")}
				</p>
			</div>
		</div>
	);
}
