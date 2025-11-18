"use client";

import { Bot, CircleStar, Crown, Grid3x3, Home, Key } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "~/components/ThemeToggle";
import { UserButton } from "~/components/UserButton";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";

const menuItems = [
	{
		title: "Home",
		url: "/dashboard",
		icon: Home,
	},
	{
		title: "AI Agents",
		url: "/dashboard/agents",
		icon: Bot,
	},
	{
		title: "Tic Tac Toe",
		url: "/dashboard/tic-tac-toe",
		icon: Grid3x3,
	},
	{
		title: "Connect Four",
		url: "/dashboard/connect-four",
		icon: CircleStar,
	},
	{
		title: "Chess",
		url: "/dashboard/chess",
		icon: Crown,
	},
	{
		title: "API Keys",
		url: "/dashboard/settings/api-keys",
		icon: Key,
	},
];

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar>
			<SidebarHeader className="flex-row justify-end">
				<ModeToggle />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => {
								const isActive =
									pathname === item.url ||
									(item.url !== "/dashboard" && pathname?.startsWith(item.url));

								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link href={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<UserButton />
			</SidebarFooter>
		</Sidebar>
	);
}
