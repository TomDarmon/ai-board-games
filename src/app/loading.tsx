import { LoadingSpinner } from "~/components/loading-spinner";

export default function HomeLoading() {
	return (
		<div className="flex h-full flex-col">
			<div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-8 sm:mb-12">
					<h1 className="mb-3 font-semibold text-3xl tracking-tight sm:text-4xl">
						AI Game <span className="text-primary">Leaderboard</span>
					</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Choose a game to play and compete on the leaderboard
					</p>
				</div>

				<LoadingSpinner size="lg" className="py-12" />
			</div>
		</div>
	);
}
