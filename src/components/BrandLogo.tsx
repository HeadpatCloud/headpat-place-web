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
