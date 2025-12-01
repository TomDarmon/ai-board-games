"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import type { PlayerId } from "~/drizzle/schema";
import {
	type GameResult,
	GameStatus,
	type Turn,
	TurnStatus,
} from "~/shared/@types";
import { api } from "~/trpc/react";
import { GameMatchLayout } from "./GameMatchLayout";
import { GameMoveList } from "./GameMoveList";
import { type AgentInfo, MatchInfoPanel } from "./MatchInfoPanel";

type BaseGameReplayProps = {
	renderBoard: (turns: Turn[], currentStep: number) => ReactNode;
	/** Display labels for each player (e.g., "White" for chess, "Player X" for tic-tac-toe) */
	playerLabels?: Record<PlayerId, string>;
	formatMove?: (move: Turn["move"]) => string;
	customWinnerText?: (winner: GameResult) => string;
};

type ChessReplayProps = BaseGameReplayProps & {
	matchId: string;
	gameType: "chess";
};

type TicTacToeReplayProps = BaseGameReplayProps & {
	matchId: string;
	gameType: "ticTacToe";
};

type ConnectFourReplayProps = BaseGameReplayProps & {
	matchId: string;
	gameType: "connectFour";
};

type GameReplayProps =
	| ChessReplayProps
	| TicTacToeReplayProps
	| ConnectFourReplayProps;

export function GameReplay(props: GameReplayProps) {
	const {
		matchId,
		gameType,
		renderBoard,
		playerLabels,
		formatMove,
		customWinnerText,
	} = props;

	const [currentStep, setCurrentStep] = useState(0);
	const hasInitialized = useRef(false);

	// Use the appropriate API based on game type
	const chessQuery = api.chess.getMatch.useQuery(
		{ id: matchId },
		{ enabled: gameType === "chess" },
	);
	const ticTacToeQuery = api.ticTacToe.getMatch.useQuery(
		{ id: matchId },
		{ enabled: gameType === "ticTacToe" },
	);
	const connectFourQuery = api.connectFour.getMatch.useQuery(
		{ id: matchId },
		{ enabled: gameType === "connectFour" },
	);

	const query =
		gameType === "chess"
			? chessQuery
			: gameType === "ticTacToe"
				? ticTacToeQuery
				: connectFourQuery;

	const { data: match, isLoading } = query;

	useEffect(() => {
		if (!matchId) {
			return;
		}
		hasInitialized.current = false;
		setCurrentStep(0);
	}, [matchId]);

	// Auto-advance to last move when match data loads (only once per match)
	useEffect(() => {
		if (!match || hasInitialized.current) {
			return;
		}

		setCurrentStep(match.turns.length);
		hasInitialized.current = true;
	}, [match]);

	if (isLoading || !match) {
		return (
			<Card>
				<CardContent className="py-8">
					<div className="flex flex-col items-center gap-2">
						<p className="text-muted-foreground text-sm">Loading match...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Convert database turns to our Turn type
	const turns: Turn[] = match.turns.map((t) => ({
		turnNumber: t.moveNumber,
		player: t.player as PlayerId,
		move: t.move as Turn["move"],
		status: TurnStatus.success,
	}));

	const maxStep = turns.length;
	const isLive = match.status === GameStatus.playing;

	// Extract agent info from match data
	const agents: Partial<Record<PlayerId, AgentInfo>> =
		(match as { agents?: Partial<Record<PlayerId, AgentInfo>> }).agents ?? {};

	return (
		<GameMatchLayout
			board={renderBoard(turns, currentStep)}
			moveList={
				<GameMoveList
					turns={turns}
					currentStep={currentStep}
					onMoveClick={(step) => setCurrentStep(step)}
					playerNames={playerLabels}
					formatMove={formatMove}
				/>
			}
			infoPanel={
				<div className="space-y-4">
					<MatchInfoPanel
						isComplete={match.status === GameStatus.finished}
						winner={match.winner as GameResult}
						currentPlayer={match.currentPlayer as PlayerId}
						turns={turns.slice(0, currentStep)}
						playerLabels={playerLabels}
						agents={agents}
					/>
				</div>
			}
			error={null}
		/>
	);
}
