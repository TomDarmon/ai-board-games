import { Chess } from "chess.js";

import { PlayerId } from "~/drizzle/schema";
import {
	type ChessMove,
	type ChessSerializedState,
	type Engine,
	GameResult,
	GameStatus,
	type Move,
	type MoveResult,
	type SerializedState,
} from "../../shared/@types";

const DEFAULT_FEN = new Chess().fen();

function assertChessMove(move: Move): move is ChessMove {
	return (
		typeof (move as ChessMove).from === "string" &&
		typeof (move as ChessMove).to === "string"
	);
}

function createGame(state?: ChessSerializedState): Chess {
	try {
		return state ? new Chess(state.fen) : new Chess();
	} catch (error) {
		throw new Error(
			error instanceof Error
				? `Invalid chess state: ${error.message}`
				: "Invalid chess state",
		);
	}
}

function toChessMove(move: Move): ChessMove {
	if (!assertChessMove(move)) {
		throw new Error("Invalid chess move: from/to are required");
	}

	const chessMove: ChessMove = {
		from: move.from,
		to: move.to,
	};

	if (move.promotion) {
		chessMove.promotion = move.promotion as ChessMove["promotion"];
	}

	return chessMove;
}

function determineResult(
	game: Chess,
	currentPlayer: PlayerId,
): {
	status: GameStatus;
	result: GameResult;
} {
	if (!game.isGameOver()) {
		return {
			status: GameStatus.playing,
			result: GameResult.none,
		};
	}

	if (game.isCheckmate()) {
		return {
			status: GameStatus.finished,
			result: currentPlayer === PlayerId.X ? GameResult.X : GameResult.O,
		};
	}

	if (game.isDraw()) {
		return {
			status: GameStatus.finished,
			result: GameResult.draw,
		};
	}

	// Covers other terminal cases such as stalemate/insufficient material/threefold
	return {
		status: GameStatus.finished,
		result: GameResult.draw,
	};
}

function extractState(game: Chess): ChessSerializedState {
	return { fen: game.fen() };
}

export const chessEngine: Engine = {
	initialState(): SerializedState {
		return { fen: DEFAULT_FEN } satisfies ChessSerializedState;
	},

	listLegalMoves(state: SerializedState, _currentPlayer: PlayerId): Move[] {
		const game = createGame(state as ChessSerializedState);
		return game.moves({ verbose: true }).map((move) => {
			const formatted: Move = {
				from: move.from,
				to: move.to,
			};

			if (move.promotion) {
				formatted.promotion = move.promotion;
			}

			return formatted;
		});
	},

	isLegalMove(
		state: SerializedState,
		move: Move,
		_currentPlayer: PlayerId,
	): boolean {
		try {
			const chessMove = toChessMove(move);
			const game = createGame(state as ChessSerializedState);
			const result = game.move(chessMove);
			return result !== null;
		} catch {
			return false;
		}
	},

	applyMove(
		state: SerializedState,
		move: Move,
		currentPlayer: PlayerId,
	): MoveResult {
		const chessMove = toChessMove(move);
		const game = createGame(state as ChessSerializedState);

		const result = game.move(chessMove);
		if (!result) {
			throw new Error("Illegal move");
		}

		const { status, result: outcome } = determineResult(game, currentPlayer);
		const nextPlayer = this.getNextPlayer(currentPlayer);

		return {
			nextState: extractState(game),
			nextPlayer,
			status,
			result: outcome,
		};
	},

	isTerminal(state: SerializedState): boolean {
		const game = createGame(state as ChessSerializedState);
		return game.isGameOver();
	},

	getResult(state: SerializedState): GameResult {
		const game = createGame(state as ChessSerializedState);
		if (!game.isGameOver()) {
			return GameResult.none;
		}

		if (game.isCheckmate()) {
			// When in checkmate the side to move has no moves, so the winner is the opponent
			return game.turn() === "w" ? GameResult.O : GameResult.X;
		}

		return GameResult.draw;
	},

	serialize(state: SerializedState): string {
		return JSON.stringify(state);
	},

	deserialize(serialized: string): SerializedState {
		const parsed = JSON.parse(serialized) as ChessSerializedState;
		if (!parsed || typeof parsed.fen !== "string") {
			throw new Error("Invalid serialized chess state");
		}

		// Validate Fen by constructing a Chess instance
		void createGame(parsed);
		return parsed;
	},

	getNextPlayer(currentPlayer: PlayerId): PlayerId {
		return currentPlayer === PlayerId.X ? PlayerId.O : PlayerId.X;
	},
};
