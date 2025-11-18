"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PlayerId } from "~/drizzle/schema";
import { GameResult, type Turn, TurnStatus } from "~/shared/@types";

type Props = {
	isComplete: boolean;
	winner: GameResult | null;
	currentPlayer: PlayerId | null;
	turns: Turn[];
	playerNames?: Record<PlayerId, string>;
	customWinnerText?: (winner: GameResult) => string;
};

export function MatchInfoPanel({
	isComplete,
	winner,
	currentPlayer,
	turns,
	playerNames = { [PlayerId.X]: "Player X", [PlayerId.O]: "Player O" },
	customWinnerText,
}: Props) {
	// Find if there's a currently thinking player
	const thinkingTurn = turns.find((t) => t.status === TurnStatus.loading);

	const getWinnerText = (result: GameResult) => {
		if (customWinnerText) {
			return customWinnerText(result);
		}
		if (result === GameResult.draw) {
			return "It's a Draw! 🤝";
		}
		// Result is either X or O at this point
		const winner = result === GameResult.X ? PlayerId.X : PlayerId.O;
		return `${playerNames[winner]} Wins! 🎉`;
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm">Match Status</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{isComplete ? (
					<div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 px-3 py-4">
						<div className="text-center font-semibold text-base">
							{winner && winner !== GameResult.none ? (
								<span
									className={
										winner === GameResult.draw
											? "text-muted-foreground"
											: winner === GameResult.X
												? "text-primary"
												: "text-destructive"
									}
								>
									{getWinnerText(winner)}
								</span>
							) : (
								<span className="text-muted-foreground">Game Over</span>
							)}
						</div>
					</div>
				) : thinkingTurn ? (
					<div className="flex items-center justify-center gap-2 rounded-lg border border-accent bg-accent/30 px-3 py-3">
						<span className="animate-pulse text-lg">💭</span>
						<span className="font-medium text-accent-foreground text-sm">
							{playerNames[thinkingTurn.player]} thinking...
						</span>
					</div>
				) : currentPlayer ? (
					<div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 px-3 py-3">
						<span className="font-medium text-sm">
							<span className="text-muted-foreground">Turn: </span>
							<span className="text-foreground">
								{playerNames[currentPlayer]}
							</span>
						</span>
					</div>
				) : (
					<div className="flex items-center justify-center py-3 text-muted-foreground text-xs">
						Waiting to start...
					</div>
				)}
			</CardContent>
		</Card>
	);
}
