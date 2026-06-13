import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];
const MIN_YEAR = 1920;
const CURRENT_YEAR = new Date().getFullYear();
// Newest first — most users picking a birthday are closer to recent decades,
// and the select supports type-ahead (type "1995" to jump).
const YEARS = Array.from(
	{ length: CURRENT_YEAR - MIN_YEAR + 1 },
	(_, i) => CURRENT_YEAR - i,
);

export function BirthdayPicker({
	value,
	onChange,
}: {
	value: Date | null;
	onChange: (d: Date | null) => void;
}) {
	const t = useTranslations("accountPages");
	const [open, setOpen] = useState(false);
	// The month shown in the grid, driven by the two selects. Controlling it is
	// what makes the year/month actually apply when a day is then clicked.
	const [month, setMonth] = useState<Date>(value ?? new Date(2000, 0, 1));

	// Keep the grid aligned when the value loads/changes from outside.
	useEffect(() => {
		if (value) setMonth(value);
	}, [value]);

	return (
		<div className="flex items-center gap-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className={cn(
							"w-[240px] justify-start text-left font-normal",
							!value && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 size-4" />
						{value ? format(value, "d MMMM yyyy") : t("pickBirthday")}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-3" align="start">
					<div className="mb-3 flex gap-2">
						<Select
							value={String(month.getMonth())}
							onValueChange={(v) =>
								setMonth(new Date(month.getFullYear(), Number(v), 1))
							}
						>
							<SelectTrigger className="h-9 flex-1" aria-label={t("month")}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="max-h-72">
								{MONTHS.map((m, i) => (
									<SelectItem key={m} value={String(i)}>
										{m}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={String(month.getFullYear())}
							onValueChange={(v) =>
								setMonth(new Date(Number(v), month.getMonth(), 1))
							}
						>
							<SelectTrigger className="h-9 w-[92px]" aria-label={t("year")}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="max-h-72">
								{YEARS.map((y) => (
									<SelectItem key={y} value={String(y)}>
										{y}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Calendar
						mode="single"
						month={month}
						onMonthChange={setMonth}
						startMonth={new Date(MIN_YEAR, 0)}
						endMonth={new Date(CURRENT_YEAR, 11)}
						selected={value ?? undefined}
						onSelect={(d) => {
							onChange(d ?? null);
							if (d) setOpen(false);
						}}
						disabled={{ after: new Date() }}
						classNames={{ month_caption: "hidden", nav: "hidden" }}
					/>
				</PopoverContent>
			</Popover>
			{value ? (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label={t("clearBirthday")}
					onClick={() => onChange(null)}
				>
					<X className="size-4" />
				</Button>
			) : null}
		</div>
	);
}
