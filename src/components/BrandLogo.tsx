const FILES = {
	sm: {
		dark: "/logos/logo_dark_transparent_x64.webp",
		light: "/logos/logo_light_transparent_x64.webp",
	},
	lg: {
		dark: "/logos/logo_dark_transparent_x256.png",
		light: "/logos/logo_light_transparent_x256.png",
	},
};

/** The `_dark` assets have dark ink (for light backgrounds), so they show in
 *  light mode. Both render and CSS picks one, so the right one is up before
 *  hydration. */
export function BrandLogo({
	size,
	alt,
	className = "",
	width,
	height,
}: {
	size: keyof typeof FILES;
	alt: string;
	className?: string;
	width?: number;
	height?: number;
}) {
	return (
		<>
			<img
				src={FILES[size].dark}
				alt={alt}
				width={width}
				height={height}
				draggable={false}
				className={`${className} block dark:hidden`}
			/>
			<img
				src={FILES[size].light}
				alt={alt}
				width={width}
				height={height}
				draggable={false}
				className={`${className} hidden dark:block`}
			/>
		</>
	);
}

const LOCKUP = {
	dark: "/logos/place_dark",
	light: "/logos/place_light",
};

/** The headpat.place wordmark next to the paw, themed like BrandLogo. */
export function BrandLockup({
	alt,
	className = "",
}: {
	alt: string;
	className?: string;
}) {
	return (
		<>
			{(["dark", "light"] as const).map((ink) => (
				<img
					key={ink}
					src={`${LOCKUP[ink]}_x250.webp`}
					srcSet={`${LOCKUP[ink]}_x250.webp 1x, ${LOCKUP[ink]}_x500.webp 2x`}
					alt={alt}
					width={1586}
					height={546}
					draggable={false}
					className={`${className} w-auto ${ink === "dark" ? "block dark:hidden" : "hidden dark:block"}`}
				/>
			))}
		</>
	);
}
