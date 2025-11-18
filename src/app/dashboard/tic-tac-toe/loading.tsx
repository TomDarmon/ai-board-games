import { LoadingSpinner } from "~/components/loading-spinner";

export default function TicTacToeLoading() {
	return (
		<div className="flex h-full flex-col">
			<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
				<div className="mb-6">
					<h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
						Tic <span className="text-primary">Tac</span> Toe
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Play and manage your games
					</p>
				</div>

				<LoadingSpinner size="lg" className="py-12" />
			</div>
		</div>
	);
}
