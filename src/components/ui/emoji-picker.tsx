"use client";

import { EmojiPicker as EmojiPickerPrimitive } from "frimousse";
import { LoaderIcon, SearchIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

function EmojiPicker({
	className,
	...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Root>) {
	return (
		<EmojiPickerPrimitive.Root
			data-slot="emoji-picker"
			className={cn(
				"isolate flex h-full w-fit flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function EmojiPickerSearch({
	className,
	...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Search>) {
	return (
		<div
			data-slot="emoji-picker-search-wrapper"
			className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3"
		>
			<SearchIcon className="size-4 shrink-0 opacity-50" />
			<EmojiPickerPrimitive.Search
				data-slot="emoji-picker-search"
				className={cn(
					"flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function EmojiPickerContent({
	className,
	...props
}: React.ComponentProps<typeof EmojiPickerPrimitive.Viewport>) {
	return (
		<EmojiPickerPrimitive.Viewport
			data-slot="emoji-picker-viewport"
			className={cn("relative flex-1 outline-none", className)}
			{...props}
		>
			<EmojiPickerPrimitive.Loading
				data-slot="emoji-picker-loading"
				className="absolute inset-0 flex items-center justify-center text-muted-foreground"
			>
				<LoaderIcon className="size-4 animate-spin" />
			</EmojiPickerPrimitive.Loading>
			<EmojiPickerPrimitive.Empty
				data-slot="emoji-picker-empty"
				className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
			>
				No emoji found.
			</EmojiPickerPrimitive.Empty>
			<EmojiPickerPrimitive.List
				data-slot="emoji-picker-list"
				className="select-none pb-1"
				components={{
					CategoryHeader: ({ category, ...rest }) => (
						<div
							className="bg-popover px-3 pb-1.5 pt-3 text-xs font-medium text-muted-foreground"
							{...rest}
						>
							{category.label}
						</div>
					),
					Row: ({ children, ...rest }) => (
						<div className="scroll-my-1 px-1" {...rest}>
							{children}
						</div>
					),
					Emoji: ({ emoji, ...rest }) => (
						<button
							type="button"
							className={cn(
								"flex size-7 items-center justify-center rounded-md text-base",
								emoji.isActive && "bg-muted",
							)}
							{...rest}
						>
							{emoji.emoji}
						</button>
					),
				}}
			/>
		</EmojiPickerPrimitive.Viewport>
	);
}

export { EmojiPicker, EmojiPickerSearch, EmojiPickerContent };
