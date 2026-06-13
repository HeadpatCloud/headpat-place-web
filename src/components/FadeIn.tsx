import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// Staggered entrance: each item fades + rises in, delayed by its reading-order
// index so a group cascades top-left → bottom-right when it mounts.
export function FadeIn({
	index = 0,
	className,
	children,
}: {
	index?: number;
	className?: string;
	children: ReactNode;
}) {
	const reduce = useReducedMotion();
	return (
		<motion.div
			className={className}
			initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.45,
				ease: [0.16, 1, 0.3, 1],
				delay: reduce ? 0 : index * 0.06,
			}}
		>
			{children}
		</motion.div>
	);
}
