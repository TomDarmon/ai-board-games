"use client";

import { useEffect, useState } from "react";
import { GameMatchLayout } from "~/components/GameMatchLayout";
import { GameMoveList } from "~/components/GameMoveList";
import { GameReplay } from "~/components/GameReplay";
import { MatchInfoPanel } from "~/components/MatchInfoPanel";
import { GameLobbyMatchHistory } from "~/components/game/GameLobbyMatchHistory";
import { GameLobbyStartCard } from "~/components/game/GameLobbyStartCard";
import { TicTacToeBoard } from "~/components/tic-tac-toe/TicTacToeBoard";
import { Button } from "~/components/ui/button";
import { GameType, PlayerId } from "~/drizzle/schema";
import { useMatchStreaming } from "~/hooks/use-match-streaming";
import { GameResult, GameStatus } from "~/shared/@types";
import { BATCH_SIZE, MATCHES_PER_PAGE } from "~/shared/constants";
import { api } from "~/trpc/react";

type ViewMode = "list" | "live" | "replay";

export function TicTacToeStreamingClient() {
	const [currentPage, setCurrentPage] = useState(0);
	const [viewMode, setViewMode] = useState<ViewMode>("list");
	const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
	const [agentX, setAgentX] = useState<string | null>(null);
	const [agentO, setAgentO] = useState<string | null>(null);

	// Calculate which batch we need (each batch has 120 matches, showing 10 per page = 12 pages per batch)
	const batchNumber = Math.floor(currentPage / (BATCH_SIZE / MATCHES_PER_PAGE));
	const offset = batchNumber * BATCH_SIZE;
	const { data: matchesBatch, isLoading } = api.ticTacToe.getMatches.useQuery({
		offset,
		limit: BATCH_SIZE,
	});

	// Get the 10 matches for the current page from the batch
	const startIndex =
		(currentPage % (BATCH_SIZE / MATCHES_PER_PAGE)) * MATCHES_PER_PAGE;
	const matches =
		matchesBatch?.slice(startIndex, startIndex + MATCHES_PER_PAGE) ?? [];

	// Check if there are more pages:
	// 1. More matches in the current batch (within batch pagination)
	// 2. OR we got a full batch (120 matches), meaning there might be more batches
	const hasMoreInBatch =
		matchesBatch && startIndex + MATCHES_PER_PAGE < matchesBatch.length;
	const hasMoreBatches = matchesBatch && matchesBatch.length === BATCH_SIZE;
	const hasMore = !!(hasMoreInBatch || hasMoreBatches);

	const {
		matchId,
		isComplete,
		loading,
		winner,
		currentPlayer,
		turns,
		agents,
		error,
		startMatch,
		stopMatch,
	} = useMatchStreaming({
		onMatchComplete: (winner) => {
			const winnerText =
				winner === GameResult.draw ? "Draw" : `Player ${winner} wins`;
		},
	});

	// Auto-switch to replay mode when match completes
	useEffect(() => {
		if (viewMode === "live" && isComplete && matchId) {
			setSelectedMatchId(matchId);
			setViewMode("replay");
		}
	}, [viewMode, isComplete, matchId]);

	const handleStartMatch = () => {
		if (!agentX || !agentO) return;

		startMatch({
			gameType: GameType.ticTacToe,
			playerXAgentId: agentX,
			playerOAgentId: agentO,
		});
		setViewMode("live");
	};

	const handleSelectMatch = (matchId: string) => {
		setSelectedMatchId(matchId);
		setViewMode("replay");
	};

	const handleBackToList = () => {
		setViewMode("list");
		setSelectedMatchId(null);
	};

	const formatTicTacToeMove = (move: Record<string, unknown>) => {
		if ("position" in move) {
			return `Pos ${move.position}`;
		}
		return JSON.stringify(move);
	};

	// Render based on view mode
	if (viewMode === "live") {
		return (
			<GameMatchLayout
				header={
					<div className="flex items-center justify-between gap-4">
						<Button variant="outline" size="sm" onClick={handleBackToList}>
							← Back to Matches
						</Button>
						{!isComplete && loading && (
							<Button
								variant="destructive"
								size="sm"
								onClick={() => void stopMatch()}
							>
								Stop Match
							</Button>
						)}
					</div>
				}
				board={<TicTacToeBoard turns={turns} />}
				moveList={
					<GameMoveList turns={turns} formatMove={formatTicTacToeMove} />
				}
				infoPanel={
					<MatchInfoPanel
						isComplete={isComplete}
						winner={winner}
						currentPlayer={currentPlayer}
						turns={turns}
						playerLabels={{
							[PlayerId.X]: "Player X",
							[PlayerId.O]: "Player O",
						}}
						agents={agents}
					/>
				}
				error={error}
			/>
		);
	}

	if (viewMode === "replay" && selectedMatchId) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" onClick={handleBackToList}>
						← Back to Matches
					</Button>
				</div>
				<GameReplay
					matchId={selectedMatchId}
					gameType="ticTacToe"
					renderBoard={(turns, currentStep) => (
						<TicTacToeBoard turns={turns} currentStep={currentStep} />
					)}
					formatMove={formatTicTacToeMove}
				/>
			</div>
		);
	}

	// Default: show match list
	return (
		<div className="space-y-6">
			<GameLobbyStartCard
				playerXLabel="Player X"
				playerOLabel="Player O"
				agentX={agentX}
				agentO={agentO}
				onAgentXChange={setAgentX}
				onAgentOChange={setAgentO}
				onStartMatch={handleStartMatch}
				loading={loading}
			/>

			<GameLobbyMatchHistory
				matches={matches}
				isLoading={isLoading}
				currentPage={currentPage}
				hasMore={hasMore}
				onSelectMatch={handleSelectMatch}
				onPreviousPage={() => setCurrentPage((p) => Math.max(0, p - 1))}
				onNextPage={() => setCurrentPage((p) => p + 1)}
				formatMatchStatus={(match) => {
					if (match.status === GameStatus.finished) {
						if (match.winner === GameResult.draw) {
							return "Draw";
						}
						return `${match.winner} Won`;
					}
					return "In Progress";
				}}
			/>
		</div>
	);
}
