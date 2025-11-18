import { PlayerId } from "~/drizzle/schema";
import {
	type Engine,
	GameResult,
	GameStatus,
	type Move,
	type MoveResult,
	type SerializedState,
} from "../../shared/@types";

const COLS = 7;
const ROWS = 6;

type ConnectFourState = {
	board: (PlayerId | null)[][]; // [row][col], row 0 is top
};

function checkWinner(board: (PlayerId | null)[][]): PlayerId | null {
	// Check horizontal
	for (let row = 0; row < ROWS; row++) {
		const rowArray = board[row];
		if (!rowArray) continue;
		for (let col = 0; col <= COLS - 4; col++) {
			const player = rowArray[col];
			if (
				player &&
				player === rowArray[col + 1] &&
				player === rowArray[col + 2] &&
				player === rowArray[col + 3]
			) {
				return player;
			}
		}
	}

	// Check vertical
	for (let row = 0; row <= ROWS - 4; row++) {
		for (let col = 0; col < COLS; col++) {
			const player = board[row]?.[col];
			const row1 = board[row + 1];
			const row2 = board[row + 2];
			const row3 = board[row + 3];
			if (
				player &&
				row1 &&
				row2 &&
				row3 &&
				player === row1[col] &&
				player === row2[col] &&
				player === row3[col]
			) {
				return player;
			}
		}
	}

	// Check diagonal (top-left to bottom-right)
	for (let row = 0; row <= ROWS - 4; row++) {
		for (let col = 0; col <= COLS - 4; col++) {
			const player = board[row]?.[col];
			const row1 = board[row + 1];
			const row2 = board[row + 2];
			const row3 = board[row + 3];
			if (
				player &&
				row1 &&
				row2 &&
				row3 &&
				player === row1[col + 1] &&
				player === row2[col + 2] &&
				player === row3[col + 3]
			) {
				return player;
			}
		}
	}

	// Check diagonal (top-right to bottom-left)
	for (let row = 0; row <= ROWS - 4; row++) {
		for (let col = 3; col < COLS; col++) {
			const player = board[row]?.[col];
			const row1 = board[row + 1];
			const row2 = board[row + 2];
			const row3 = board[row + 3];
			if (
				player &&
				row1 &&
				row2 &&
				row3 &&
				player === row1[col - 1] &&
				player === row2[col - 2] &&
				player === row3[col - 3]
			) {
				return player;
			}
		}
	}

	return null;
}

function isDraw(board: (PlayerId | null)[][]): boolean {
	const topRow = board[0];
	return topRow ? topRow.every((cell) => cell !== null) : false;
}

function findLandingRow(board: (PlayerId | null)[][], column: number): number {
	for (let row = ROWS - 1; row >= 0; row--) {
		const rowArray = board[row];
		if (rowArray && rowArray[column] === null) {
			return row;
		}
	}
	return -1; // Column is full
}

function reconstructBoardFromMoves(
	moves: Array<{ column: number; player: PlayerId }>,
): (PlayerId | null)[][] {
	const board: (PlayerId | null)[][] = Array(ROWS)
		.fill(null)
		.map(() => Array(COLS).fill(null) as (PlayerId | null)[]);

	for (const move of moves) {
		const landingRow = findLandingRow(board, move.column);
		if (landingRow >= 0) {
			const rowArray = board[landingRow];
			if (rowArray) {
				rowArray[move.column] = move.player;
			}
		}
	}

	return board;
}

export const connectFourEngine: Engine = {
	initialState(): SerializedState {
		return {
			board: Array(ROWS)
				.fill(null)
				.map(() => Array(COLS).fill(null) as (PlayerId | null)[]),
		};
	},

	listLegalMoves(state: SerializedState, _currentPlayer: PlayerId): Move[] {
		const gameState = state as ConnectFourState;
		const legalMoves: Move[] = [];
		const topRow = gameState.board[0];
		if (!topRow) return legalMoves;

		for (let col = 0; col < COLS; col++) {
			if (topRow[col] === null) {
				legalMoves.push({ column: col });
			}
		}
		return legalMoves;
	},

	isLegalMove(
		state: SerializedState,
		move: Move,
		_currentPlayer: PlayerId,
	): boolean {
		const gameState = state as ConnectFourState;
		const column = move.column;
		if (typeof column !== "number" || column < 0 || column >= COLS) {
			return false;
		}
		const topRow = gameState.board[0];
		return topRow ? topRow[column] === null : false;
	},

	applyMove(
		state: SerializedState,
		move: Move,
		currentPlayer: PlayerId,
	): MoveResult {
		const gameState = state as ConnectFourState;
		const column = move.column;

		if (typeof column !== "number") {
			throw new Error("Invalid move: column must be a number");
		}

		if (column < 0 || column >= COLS) {
			throw new Error(`Invalid move: column ${column} is out of bounds`);
		}

		const topRow = gameState.board[0];
		if (!topRow || topRow[column] !== null) {
			throw new Error(`Invalid move: column ${column} is full`);
		}

		// Create new board state (immutable)
		const newBoard = gameState.board.map((row) => [...row]);
		const landingRow = findLandingRow(newBoard, column);

		if (landingRow < 0) {
			throw new Error(`Invalid move: column ${column} is full`);
		}

		const targetRow = newBoard[landingRow];
		if (targetRow) {
			targetRow[column] = currentPlayer;
		}

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
		const gameState = state as ConnectFourState;
		return checkWinner(gameState.board) !== null || isDraw(gameState.board);
	},

	getResult(state: SerializedState): GameResult {
		const gameState = state as ConnectFourState;
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
		const parsed = JSON.parse(serialized) as ConnectFourState;
		// Validate board structure
		if (
			!Array.isArray(parsed.board) ||
			parsed.board.length !== ROWS ||
			parsed.board.some((row) => !Array.isArray(row) || row.length !== COLS)
		) {
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
	moves: Array<{ column: number; player: PlayerId; moveNumber: number }>,
): (PlayerId | null)[][] {
	return reconstructBoardFromMoves(moves);
}
