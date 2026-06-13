import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, type Locale, useI18n, useTranslations } from "@/lib/i18n";

export function LanguageSwitcher() {
	const { locale, setLocale } = useI18n();
	const t = useTranslations("commonUi");
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label={t("changeLanguage")}>
					<Globe className="size-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup
					value={locale}
					onValueChange={(v) => setLocale(v as Locale)}
				>
					{LOCALES.map((l) => (
						<DropdownMenuRadioItem key={l.code} value={l.code}>
							{l.label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
