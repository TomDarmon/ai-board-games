import { PlayerId } from "~/drizzle/schema";
import {
	type Engine,
	GameResult,
	GameStatus,
	type Move,
	type MoveResult,
	type SerializedState,
} from "~/shared/@types";

const BOARD_SIZE = 9;

type TicTacToeState = {
	board: (PlayerId | null)[];
};

const WINNING_LINES = [
	[0, 1, 2], // top row
	[3, 4, 5], // middle row
	[6, 7, 8], // bottom row
	[0, 3, 6], // left column
	[1, 4, 7], // middle column
	[2, 5, 8], // right column
	[0, 4, 8], // diagonal
	[2, 4, 6], // anti-diagonal
] as const;

function checkWinner(board: (PlayerId | null)[]): PlayerId | null {
	for (const [a, b, c] of WINNING_LINES) {
		if (a !== undefined && b !== undefined && c !== undefined) {
			const player = board[a];
			if (player && player === board[b] && player === board[c]) {
				return player;
			}
		}
	}
	return null;
}

function isDraw(board: (PlayerId | null)[]): boolean {
	return board.every((cell) => cell !== null);
}

function reconstructBoardFromMoves(
	moves: Array<{ position: number; player: PlayerId }>,
): (PlayerId | null)[] {
	const board: (PlayerId | null)[] = Array(BOARD_SIZE).fill(null);
	for (const move of moves) {
		board[move.position] = move.player;
	}
	return board;
}

export const ticTacToeEngine: Engine = {
	initialState(): SerializedState {
		return {
			board: Array(BOARD_SIZE).fill(null),
		};
	},

	listLegalMoves(state: SerializedState, _currentPlayer: PlayerId): Move[] {
		const gameState = state as TicTacToeState;
		const legalMoves: Move[] = [];
		for (let i = 0; i < BOARD_SIZE; i++) {
			if (gameState.board[i] === null) {
				legalMoves.push({ position: i });
			}
		}
		return legalMoves;
	},

	isLegalMove(
		state: SerializedState,
		move: Move,
		_currentPlayer: PlayerId,
	): boolean {
		const gameState = state as TicTacToeState;
		const position = move.position;
		if (
			typeof position !== "number" ||
			position < 0 ||
			position >= BOARD_SIZE
		) {
			return false;
		}
		return gameState.board[position] === null;
	},

	applyMove(
		state: SerializedState,
		move: Move,
		currentPlayer: PlayerId,
	): MoveResult {
		const gameState = state as TicTacToeState;
		const position = move.position;

		if (typeof position !== "number") {
			throw new Error("Invalid move: position must be a number");
		}

		if (position < 0 || position >= BOARD_SIZE) {
			throw new Error(`Invalid move: position ${position} is out of bounds`);
		}

		if (gameState.board[position] !== null) {
			throw new Error(`Invalid move: position ${position} is already taken`);
		}

		// Create new board state (immutable)
		const newBoard = [...gameState.board];
		newBoard[position] = currentPlayer;

		const newState: SerializedState = { board: newBoard };

		// Check for winner or draw
		const winner = checkWinner(newBoard);
		const draw = !winner && isDraw(newBoard);

		return {
			nextState: newState,
			nextPlayer: this.getNextPlayer(currentPlayer),
			status: winner || draw ? GameStatus.finished : GameStatus.playing,
			result: winner
				? winner === PlayerId.X
					? GameResult.X
					: GameResult.O
				: draw
					? GameResult.draw
					: GameResult.none,
		};
	},

	isTerminal(state: SerializedState): boolean {
		const gameState = state as TicTacToeState;
		return checkWinner(gameState.board) !== null || isDraw(gameState.board);
	},

	getResult(state: SerializedState): GameResult {
		const gameState = state as TicTacToeState;
		const winner = checkWinner(gameState.board);
		if (winner) {
			return winner === PlayerId.X ? GameResult.X : GameResult.O;
		}
		if (isDraw(gameState.board)) {
			return GameResult.draw;
		}
		return GameResult.none;
	},

	serialize(state: SerializedState): string {
		return JSON.stringify(state);
	},

	deserialize(serialized: string): SerializedState {
		const parsed = JSON.parse(serialized) as TicTacToeState;
		// Ensure board is properly typed
		if (!Array.isArray(parsed.board) || parsed.board.length !== BOARD_SIZE) {
			throw new Error("Invalid serialized state: board is invalid");
		}
		return parsed;
	},

	getNextPlayer(currentPlayer: PlayerId): PlayerId {
		return currentPlayer === PlayerId.X ? PlayerId.O : PlayerId.X;
	},
};

/**
 * Helper to reconstruct board from move history
 * Useful for backward compatibility with existing code
 */
export function reconstructBoard(
	moves: Array<{ position: number; player: PlayerId; moveNumber: number }>,
): (PlayerId | null)[] {
	return reconstructBoardFromMoves(moves);
}
