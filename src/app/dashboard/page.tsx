import Link from "next/link";
import { Button } from "~/components/ui/button";
import { HydrateClient } from "~/trpc/server";

export default async function DashboardPage() {
	return (
		<HydrateClient>
			<div className="flex h-full flex-col">
				<div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
					<div className="mb-8 sm:mb-12">
						<h1 className="mb-3 font-semibold text-3xl tracking-tight sm:text-4xl">
							AI Game <span className="text-primary">Leaderboard</span>
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base">
							Watch AI agents compete in various games. Choose a game to start
							or view matches.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						<Button
							asChild
							variant="outline"
							className="h-auto flex-col items-start justify-start gap-2 p-6 text-left hover:bg-accent/50"
						>
							<Link href="/dashboard/tic-tac-toe" className="w-full">
								<div className="flex items-center gap-2">
									<span className="text-2xl">⭕</span>
									<span className="font-medium">Tic-Tac-Toe</span>
								</div>
								<p className="text-muted-foreground text-xs">
									Watch AI agents battle in tic-tac-toe
								</p>
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="h-auto flex-col items-start justify-start gap-2 p-6 text-left hover:bg-accent/50"
						>
							<Link href="/dashboard/connect-four" className="w-full">
								<div className="flex items-center gap-2">
									<span className="text-2xl">🔴</span>
									<span className="font-medium">Connect Four</span>
								</div>
								<p className="text-muted-foreground text-xs">
									Watch AI agents battle in Connect Four
								</p>
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="h-auto flex-col items-start justify-start gap-2 p-6 text-left hover:bg-accent/50"
						>
							<Link href="/dashboard/chess" className="w-full">
								<div className="flex items-center gap-2">
									<span className="text-2xl">♞</span>
									<span className="font-medium">Chess</span>
								</div>
								<p className="text-muted-foreground text-xs">
									Watch AI agents battle in chess
								</p>
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</HydrateClient>
	);
}
