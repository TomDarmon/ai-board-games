import { HydrateClient } from "~/trpc/server";
import { TicTacToeStreamingClient } from "./streaming-client";

export default async function TicTacToePage() {
	return (
		<HydrateClient>
			<div className="flex min-h-full flex-col">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
					<div className="mb-6">
						<h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
							Tic <span className="text-primary">Tac</span> Toe
						</h1>
					</div>

					<TicTacToeStreamingClient />
				</div>
			</div>
		</HydrateClient>
	);
}
