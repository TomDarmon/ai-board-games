"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PlayerId } from "~/drizzle/schema";
import { GameResult, type Turn, TurnStatus } from "~/shared/@types";

export type AgentInfo = {
	name: string;
	model?: string | null;
};

type Props = {
	isComplete: boolean;
	winner: GameResult | null;
	currentPlayer: PlayerId | null;
	turns: Turn[];
	/** Display names for each player (e.g., "White" for chess, "Player X" for tic-tac-toe) */
	playerLabels?: Record<PlayerId, string>;
	/** Agent information for each player */
	agents?: Partial<Record<PlayerId, AgentInfo>>;
};

export function MatchInfoPanel({
	isComplete,
	winner,
	currentPlayer,
	turns,
	playerLabels = { [PlayerId.X]: "Player X", [PlayerId.O]: "Player O" },
	agents,
}: Props) {
	// Find if there's a currently thinking player
	const thinkingTurn = turns.find((t) => t.status === TurnStatus.loading);

	const renderPlayerCard = (playerId: PlayerId) => {
		const agent = agents?.[playerId];
		const label = playerLabels[playerId];
		const isCurrentPlayer = currentPlayer === playerId;
		const isThinking = thinkingTurn?.player === playerId;
		const isWinner =
			isComplete &&
			winner &&
			((winner === GameResult.X && playerId === PlayerId.X) ||
				(winner === GameResult.O && playerId === PlayerId.O));

		return (
			<div
				key={playerId}
				className={`rounded-lg border p-3 transition-all ${
					isThinking
						? "border-accent bg-accent/20"
						: isCurrentPlayer && !isComplete
							? "border-primary/50 bg-primary/5"
							: isWinner
								? "border-green-500 bg-green-500/10"
								: "border-border bg-muted/30"
				}`}
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<span
							className={`rounded px-1.5 py-0.5 font-semibold text-xs ${
								playerId === PlayerId.X
									? "bg-primary/20 text-primary"
									: "bg-destructive/20 text-destructive"
							}`}
						>
							{label}
						</span>
						{isThinking && (
							<span className="animate-pulse text-sm">💭 Thinking...</span>
						)}
						{isWinner && <span className="text-sm">🏆 Winner!</span>}
					</div>
				</div>
				{agent && (
					<div className="mt-2 space-y-1">
						<p className="truncate font-medium text-foreground text-sm">
							{agent.name}
						</p>
						{agent.model && (
							<p className="truncate text-muted-foreground text-xs">
								{agent.model}
							</p>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm">Players</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{/* Player Cards */}
				<div className="space-y-2">
					{renderPlayerCard(PlayerId.X)}
					{renderPlayerCard(PlayerId.O)}
				</div>
			</CardContent>
		</Card>
	);
}
