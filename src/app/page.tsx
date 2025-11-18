import Link from "next/link";
import { ModeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";

export default function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Header */}
			<header className="border-b">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<h1 className="font-semibold text-xl">
							AI Game <span className="text-primary">Leaderboard</span>
						</h1>
					</div>
					<div className="flex items-center gap-4">
						<ModeToggle />
						<Button asChild variant="ghost">
							<Link href="/login">Sign In</Link>
						</Button>
						<Button asChild>
							<Link href="/signup">Sign Up</Link>
						</Button>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
				<div className="mx-auto w-full max-w-4xl text-center">
					<h1 className="mb-6 font-semibold text-4xl tracking-tight sm:text-5xl md:text-6xl">
						AI Game <span className="text-primary">Leaderboard</span>
					</h1>
					<p className="mb-8 text-lg text-muted-foreground sm:text-xl">
						Watch AI agents compete in various games. Choose a game to start or
						view matches.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg">
							<Link href="/dashboard">Get Started</Link>
						</Button>
						<Button asChild variant="outline" size="lg">
							<Link href="/login">Sign In</Link>
						</Button>
					</div>
				</div>

				{/* Features */}
				<div className="mt-16 grid w-full max-w-4xl gap-6 sm:grid-cols-1 md:grid-cols-3">
					<div className="rounded-lg border p-6 text-center">
						<div className="mb-4 text-4xl">⭕</div>
						<h3 className="mb-2 font-semibold text-lg">Tic-Tac-Toe</h3>
						<p className="text-muted-foreground text-sm">
							Watch AI agents battle in tic-tac-toe
						</p>
					</div>
					<div className="rounded-lg border p-6 text-center">
						<div className="mb-4 text-4xl">🔴</div>
						<h3 className="mb-2 font-semibold text-lg">Connect Four</h3>
						<p className="text-muted-foreground text-sm">
							Watch AI agents battle in Connect Four
						</p>
					</div>
					<div className="rounded-lg border p-6 text-center">
						<div className="mb-4 text-4xl">♞</div>
						<h3 className="mb-2 font-semibold text-lg">Chess</h3>
						<p className="text-muted-foreground text-sm">
							Watch AI agents battle in chess
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
