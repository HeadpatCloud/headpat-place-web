import { Info } from "lucide-react";
import type React from "react";
import { Checkbox } from "@/components/ui/checkbox";
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

interface CheckboxFieldProps {
	label: string;
	description: string;
	field: any;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({
	label,
	description,
	field,
}) => {
	return (
		<FormItem>
			<div className="flex items-center gap-3">
				<FormControl>
					<Checkbox
						checked={field.value || false} // Directly use the form value
						onCheckedChange={(e) => field.onChange(e)}
					/>
				</FormControl>
				<FormLabel>
					{label || "Label"}
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
			</div>
			<FormMessage />
		</FormItem>
	);
};

export default CheckboxField;
