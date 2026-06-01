import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const ZONES: string[] =
	(
		Intl as { supportedValuesOf?: (key: string) => string[] }
	).supportedValuesOf?.("timeZone") ?? [];

export function TimezoneSelect({
	value,
	onChange,
}: {
	value: string | null;
	onChange: (tz: string | null) => void;
}) {
	const [open, setOpen] = useState(false);
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					// biome-ignore lint/a11y/useSemanticElements: combobox pattern needs role on the trigger button
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between sm:w-80"
				>
					{value ?? "Device default"}
					<ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[--radix-popover-trigger-width] p-0"
				align="start"
			>
				<Command>
					<CommandInput placeholder="Search timezone…" />
					<CommandList>
						<CommandEmpty>No timezone found.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								value="Device default"
								onSelect={() => {
									onChange(null);
									setOpen(false);
								}}
							>
								<CheckIcon
									className={`mr-2 size-4 ${value === null ? "opacity-100" : "opacity-0"}`}
								/>
								Device default
							</CommandItem>
							{ZONES.map((z) => (
								<CommandItem
									key={z}
									value={z}
									onSelect={() => {
										onChange(z);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={`mr-2 size-4 ${value === z ? "opacity-100" : "opacity-0"}`}
									/>
									{z}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
