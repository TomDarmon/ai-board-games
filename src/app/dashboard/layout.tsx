import { cookies } from "next/headers";

import { AppSidebar } from "~/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

export default async function DashboardLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

	return (
		<div className="min-h-screen bg-background">
			<SidebarProvider defaultOpen={defaultOpen}>
				<AppSidebar />
				<main className="flex min-h-svh flex-1 flex-col">
					<div className="flex items-center gap-2 border-b bg-background/95 px-4 py-2.5 backdrop-blur supports-backdrop-filter:bg-background/60">
						<SidebarTrigger />
					</div>
					<div className="flex-1 overflow-y-auto">{children}</div>
				</main>
			</SidebarProvider>
		</div>
	);
}
