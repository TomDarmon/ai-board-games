"use client";

import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent } from "~/components/ui/card";

type Props = {
	board: ReactNode;
	moveList: ReactNode;
	infoPanel: ReactNode;
	error?: Error | null;
	header?: ReactNode;
};

export function GameMatchLayout({
	board,
	moveList,
	infoPanel,
	error,
	header,
}: Props) {
	return (
		<div className="space-y-4">
			{/* Rules Alert */}
			<Alert>
				<AlertCircle className="h-6 w-6" />
				<AlertTitle>Match Rules</AlertTitle>
				<AlertDescription>
					Three illegal moves and the agent is out, the opponent wins
					automatically.
				</AlertDescription>
			</Alert>

			{/* Header - compact */}
			{header}

			{/* Main 3-column layout - optimized for viewport */}
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,600px)_300px] xl:justify-center">
				{/* Left: Match Info - compact */}
				<div className="order-2 xl:order-1">{infoPanel}</div>

				{/* Center: Board - constrained size */}
				<div className="order-1 xl:order-2">
					<Card>
						<CardContent className="p-3">{board}</CardContent>
					</Card>

					{/* Error Display */}
					{error && (
						<Card className="mt-4 border-red-500">
							<CardContent className="p-3">
								<div className="rounded-lg bg-red-50 p-2 dark:bg-red-950">
									<p className="text-red-700 text-sm dark:text-red-300">
										Error: {error.message}
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right: Move List - compact */}
				<div className="order-3">{moveList}</div>
			</div>
		</div>
	);
}
