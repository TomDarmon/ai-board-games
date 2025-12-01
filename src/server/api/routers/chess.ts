import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { GameType, MatchStatus, gameTurn } from "~/drizzle/schema";
import { type PlayerId, gameMatch } from "~/drizzle/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	type ChessMove,
	type GameResult,
	GameStatus,
	chessEngine,
	isGameResult,
} from "~/server/games";

const engine = chessEngine;

function mapMatchStatusToGameStatus(status: MatchStatus): GameStatus {
	switch (status) {
		case MatchStatus.playing:
			return GameStatus.playing;
		case MatchStatus.finished:
			return GameStatus.finished;
		default:
			return GameStatus.playing;
	}
}

function mapWinnerToGameResult(winner: string | null): GameResult | null {
	if (!winner) return null;
	if (isGameResult(winner)) return winner;
	return null;
}

type ChessSerializedState = { fen: string };

type AgentInfo = {
	name: string;
	model?: string | null;
};

type ChessTurn = {
	moveNumber: number;
	player: PlayerId;
	move: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" };
	stateAfterMove?: ChessSerializedState;
};

type ChessMatch = {
	id: string;
	gameType: "chess";
	status: GameStatus;
	winner: GameResult | null;
	currentPlayer: PlayerId;
	state: ChessSerializedState;
	turns: ChessTurn[];
	agents: Partial<Record<PlayerId, AgentInfo>>;
	createdAt: Date;
	updatedAt: Date;
};

type ChessMatchSummary = {
	id: string;
	gameType: "chess";
	status: GameStatus;
	winner: GameResult | null;
	currentPlayer: PlayerId;
	createdAt: Date;
	updatedAt: Date;
	lastMove: {
		moveNumber: number;
		player: PlayerId;
		move: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" };
	} | null;
};

export const chessRouter = createTRPCRouter({
	// Get a match by ID
	getMatch: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }): Promise<ChessMatch> => {
			const userId = ctx.session.user.id;
			const match = await ctx.db.query.gameMatch.findFirst({
				where: and(eq(gameMatch.id, input.id), eq(gameMatch.userId, userId)),
				with: {
					gameTurns: {
						orderBy: asc(gameTurn.moveNumber),
					},
					playerXAgent: true,
					playerOAgent: true,
				},
			});

			if (!match) {
				throw new Error("Match not found");
			}

			if (match.gameType !== GameType.chess) {
				throw new Error("Match is not a chess game");
			}

			// Deserialize the current state
			const state = engine.deserialize(match.state) as ChessSerializedState;

			// Map turns to game-specific format
			const turns: ChessTurn[] = (match.gameTurns || []).map((turn) => {
				const moveData = JSON.parse(turn.moveData) as ChessMove;
				const stateAfterMove = turn.stateAfterMove
					? (engine.deserialize(turn.stateAfterMove) as ChessSerializedState)
					: undefined;

				return {
					moveNumber: turn.moveNumber,
					player: turn.player,
					move: {
						from: moveData.from,
						to: moveData.to,
						promotion: moveData.promotion,
					},
					stateAfterMove,
				};
			});

			// Build agent info map
			const agents: Partial<Record<PlayerId, AgentInfo>> = {};
			if (match.playerXAgent) {
				agents.X = {
					name: match.playerXAgent.name,
					model: match.playerXAgent.model,
				};
			}
			if (match.playerOAgent) {
				agents.O = {
					name: match.playerOAgent.name,
					model: match.playerOAgent.model,
				};
			}

			return {
				id: match.id,
				gameType: GameType.chess,
				status: mapMatchStatusToGameStatus(match.status),
				winner: mapWinnerToGameResult(match.winner),
				currentPlayer: match.currentPlayer,
				state,
				turns,
				agents,
				createdAt: new Date(match.createdAt),
				updatedAt: new Date(match.updatedAt),
			};
		}),

	// Get matches for chess with pagination
	getMatches: protectedProcedure
		.input(
			z.object({
				offset: z.number().min(0).default(0),
				limit: z.number().min(1).max(120).default(120),
			}),
		)
		.query(async ({ ctx, input }): Promise<ChessMatchSummary[]> => {
			const userId = ctx.session.user.id;
			const matches = await ctx.db.query.gameMatch.findMany({
				where: and(
					eq(gameMatch.gameType, GameType.chess),
					eq(gameMatch.userId, userId),
				),
				with: {
					gameTurns: {
						orderBy: desc(gameTurn.moveNumber),
						limit: 1, // Get last move only
					},
				},
				orderBy: desc(gameMatch.createdAt),
				offset: input.offset,
				limit: input.limit,
			});

			return matches.map((match) => {
				const lastTurn = match.gameTurns?.[0];
				let lastMove: ChessMatchSummary["lastMove"] = null;

				if (lastTurn) {
					const moveData = JSON.parse(lastTurn.moveData) as ChessMove;
					lastMove = {
						moveNumber: lastTurn.moveNumber,
						player: lastTurn.player,
						move: {
							from: moveData.from,
							to: moveData.to,
							promotion: moveData.promotion,
						},
					};
				}

				return {
					id: match.id,
					gameType: "chess" as const,
					status: mapMatchStatusToGameStatus(match.status),
					winner: mapWinnerToGameResult(match.winner),
					currentPlayer: match.currentPlayer,
					createdAt: new Date(match.createdAt),
					updatedAt: new Date(match.updatedAt),
					lastMove,
				};
			});
		}),
});
