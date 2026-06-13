import { Info } from "lucide-react";
import type React from "react";
import { Controller } from "react-hook-form";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface SelectFieldProps {
	label: string;
	description: string;
	options: { value: string; label: string }[];
	field: any;
}

const SelectField: React.FC<SelectFieldProps> = ({
	label,
	description,
	options,
	field,
}) => {
	return (
		<FormItem>
			<FormLabel>
				{label}
				{description && (
					<HoverCard openDelay={100} closeDelay={50}>
						<HoverCardTrigger>
							<span className="ml-2 text-gray-500">
								<Info className="inline-block size-4" />
							</span>
						</HoverCardTrigger>
						<HoverCardContent>{description}</HoverCardContent>
					</HoverCard>
				)}
			</FormLabel>
			<FormControl>
				<Controller
					control={field.control}
					name={field.name}
					render={({ field: controllerField }) => (
						<Select
							value={
								Array.isArray(controllerField.value)
									? ""
									: controllerField.value || ""
							}
							onValueChange={controllerField.onChange}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select an option" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{options.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					)}
				/>
			</FormControl>
			<FormMessage />
		</FormItem>
	);
};

export default SelectField;
