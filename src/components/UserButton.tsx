"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { signOut, useSession } from "~/lib/auth-client";

export function UserButton() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			await signOut();
			toast.success("Signed out successfully");
			router.push("/login");
			router.refresh();
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Failed to sign out");
		}
	};

	if (isPending) {
		return (
			<Button
				variant="ghost"
				size="sm"
				disabled
				className="w-full justify-start"
			>
				Loading...
			</Button>
		);
	}

	if (!session?.user) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start gap-2"
				>
					<div className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-accent to-primary font-semibold text-primary-foreground text-xs">
						{session.user.name?.charAt(0).toUpperCase() ||
							session.user.email?.charAt(0).toUpperCase()}
					</div>
					<div className="flex-1 text-left">
						<p className="truncate font-medium text-sm">{session.user.name}</p>
						<p className="truncate text-muted-foreground text-xs">
							{session.user.email}
						</p>
					</div>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="flex flex-col space-y-1">
					<p className="truncate">{session.user.name}</p>
					<p className="truncate text-muted-foreground text-xs">
						{session.user.email}
					</p>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive" onClick={handleSignOut}>
					<LogOut className="size-4" />
					<span>Sign out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
