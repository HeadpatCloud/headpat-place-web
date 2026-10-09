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
					{t("impressumProvider")}
				</h2>
				<br />
				<address className="not-italic">
					Dominic Stilma
					<br />
					Friedhofsweg 10
					<br />
					49843 Uelsen
					<br />
					{t("impressumCountry")}
				</address>
				<br />
				<h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
					{t("impressumContact")}
				</h2>
				<br />
				<p>
					{t("impressumEmailLabel")}{" "}
					<a
						className="text-link hover:text-link/80"
						href="mailto:help@headpat.place"
					>
						help@headpat.place
					</a>
				</p>
				<p>
					{t("impressumWebsiteLabel")}{" "}
					<a
						className="text-link hover:text-link/80"
						href="https://headpat.place"
					>
						https://headpat.place
					</a>
				</p>
				<br />
				<p>{t("impressumContactPoint")}</p>
				<br />
				<h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
					{t("impressumResponsibleTitle")}
				</h2>
				<br />
				<p>{t("impressumResponsible")}</p>
				<br />
				<h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
					{t("impressumDisputeTitle")}
				</h2>
				<br />
				<p>{t("impressumDisputeStatement")}</p>
			</div>
		</div>
	);
}
