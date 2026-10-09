import { Separator } from "@radix-ui/react-separator";
import * as React from "react";
import { Footer } from "../Footer";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import HeaderRight from "./header-right";
import { MobileTabBar } from "./mobile-tab-bar";

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
	showFooter,
}: {
	children: React.ReactNode;
	sidebar?: React.ReactNode;
	containerClassName?: string;
	showFooter?: boolean;
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
				<header className="bg-card sticky top-3 z-20 mx-3 mt-3 flex items-center gap-3 rounded-full border border-border py-2 pr-2 pl-3 shadow-sm">
					<SidebarTrigger className="size-10 shrink-0 rounded-full" />
					{headerComponents.length > 0 && (
						<>
							<Separator orientation="vertical" />
							{headerComponents}
						</>
					)}
					<div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">
						<HeaderRight />
					</div>
				</header>
				<div
					className={
						containerClassName ??
						"mx-auto w-full max-w-5xl xl:max-w-6xl 2xl:max-w-screen-2xl px-4 py-6"
					}
				>
					{children}
				</div>
				{showFooter ? <Footer /> : null}
				<MobileTabBar />
			</SidebarInset>
		</HeaderContext.Provider>
	);
}

interface HeaderClientProps {
	children: React.ReactNode;
	sidebar?: React.ReactNode;
	containerClassName?: string;
	showFooter?: boolean;
}

export default function HeaderClient({
	children,
	sidebar,
	containerClassName,
	showFooter,
}: HeaderClientProps) {
	return (
		<SidebarProvider>
			<HeaderProvider
				sidebar={sidebar}
				containerClassName={containerClassName}
				showFooter={showFooter}
			>
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
