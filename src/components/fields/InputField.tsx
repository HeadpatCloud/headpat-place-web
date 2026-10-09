import { Info } from "lucide-react";
import type React from "react";
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
import { Input } from "@/components/ui/input";

interface InputFieldProps {
	label: string;
	description: string;
	placeholder: string;
	field: any;
	type?: string;
	maxLength?: number;
	className?: string;
	inputClassName?: string;
	prefix?: string;
}

const InputField: React.FC<InputFieldProps> = ({
	label,
	description,
	placeholder,
	field,
	type = "text",
	maxLength,
	className,
	inputClassName,
	prefix,
}) => {
	return (
		<FormItem className={className}>
			{label && (
				<FormLabel>
					{label || "Label"}
					{description && (
						<HoverCard openDelay={100} closeDelay={50}>
							<HoverCardTrigger>
								<span className="ml-2 text-muted-foreground">
									<Info className="inline-block size-4" />
								</span>
							</HoverCardTrigger>
							<HoverCardContent>{description}</HoverCardContent>
						</HoverCard>
					)}
				</FormLabel>
			)}
			<div className={prefix ? "flex items-stretch" : undefined}>
				{prefix && (
					<span className="inline-flex select-none items-center whitespace-nowrap rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
						{prefix}
					</span>
				)}
				<FormControl>
					<Input
						type={type}
						placeholder={placeholder}
						value={field.value} // Bind the value directly from `field.value`
						onChange={field.onChange} // Use `field.onChange` directly
						maxLength={maxLength}
						className={prefix ? "rounded-l-none" : inputClassName}
					/>
				</FormControl>
			</div>
			<FormMessage />
		</FormItem>
	);
};

export default InputField;
