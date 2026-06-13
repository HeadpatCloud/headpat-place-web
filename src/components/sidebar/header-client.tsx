import { Separator } from "@radix-ui/react-separator";
import * as React from "react";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { ThemeToggle } from "../ThemeToggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";

// Create a context for header components
export const HeaderContext = React.createContext<{
	addHeaderComponent: (component: React.ReactNode) => void;
	removeHeaderComponent: (component: React.ReactNode) => void;
}>({
	addHeaderComponent: () => {},
	removeHeaderComponent: () => {},
});

// Create a provider component
function HeaderProvider({
	children,
	sidebar,
	containerClassName,
}: {
	children: React.ReactNode;
	sidebar?: React.ReactNode;
	containerClassName?: string;
}) {
	const [headerComponents, setHeaderComponents] = React.useState<
		React.ReactNode[]
	>([]);

	const addHeaderComponent = React.useCallback((component: React.ReactNode) => {
		setHeaderComponents((prev) => [...prev, component]);
	}, []);

	const removeHeaderComponent = React.useCallback(
		(component: React.ReactNode) => {
			setHeaderComponents((prev) => prev.filter((c) => c !== component));
		},
		[],
	);

	return (
		<HeaderContext.Provider
			value={{ addHeaderComponent, removeHeaderComponent }}
		>
			{sidebar ?? <AppSidebar />}
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1 -mr-4 p-4" />
						<Separator orientation="vertical" />
						<LanguageSwitcher />
						<ThemeToggle />
					</div>
					{headerComponents.length > 0 && (
						<>
							<Separator orientation="vertical" />
							{headerComponents}
						</>
					)}
				</header>
				<div
					className={
						containerClassName ??
						"mx-auto w-full max-w-5xl xl:max-w-6xl 2xl:max-w-screen-2xl px-4 py-6"
					}
				>
					{children}
				</div>
			</SidebarInset>
		</HeaderContext.Provider>
	);
}

interface HeaderClientProps {
	children: React.ReactNode;
	sidebar?: React.ReactNode;
	containerClassName?: string;
}

export default function HeaderClient({
	children,
	sidebar,
	containerClassName,
}: HeaderClientProps) {
	return (
		<SidebarProvider>
			<HeaderProvider sidebar={sidebar} containerClassName={containerClassName}>
				{children}
			</HeaderProvider>
		</SidebarProvider>
	);
}

// Create a hook to use the header context
export function useHeader() {
	const context = React.useContext(HeaderContext);
	if (!context) {
		throw new Error("useHeader must be used within a HeaderProvider");
	}
	return context;
}
