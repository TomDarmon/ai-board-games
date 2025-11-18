import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/providers/theme-provider";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "AI Game Leaderboard",
	description: "A leaderboard for AI games",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${geist.variable} h-full`}>
			<body className="h-full">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					enableColorScheme
				>
					<TRPCReactProvider>{children}</TRPCReactProvider>
				</ThemeProvider>
				<Toaster />
			</body>
		</html>
	);
}
