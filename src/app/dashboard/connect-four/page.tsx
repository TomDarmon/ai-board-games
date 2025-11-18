import { HydrateClient } from "~/trpc/server";
import { ConnectFourStreamingClient } from "./streaming-client";

export default async function ConnectFourPage() {
	return (
		<HydrateClient>
			<div className="flex min-h-full flex-col">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
					<div className="mb-6">
						<h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
							Connect <span className="text-primary">Four</span>
						</h1>
					</div>

					<ConnectFourStreamingClient />
				</div>
			</div>
		</HydrateClient>
	);
}
