/**
 * Prompt formatting helpers for different game types
 */

import { GameType, type PlayerId } from "~/drizzle/schema";
import type { Move, SerializedState } from "~/shared/@types";

/**
 * Format a prompt for Tic-Tac-Toe
 */
function formatTicTacToePrompt(
	state: SerializedState,
	legalMoves: Move[],
	playerId: PlayerId,
): string {
	const board = (state as { board: (PlayerId | null)[] }).board;

	// Convert board to visual representation
	const boardDisplay = [
		`${board[0] ?? " "} | ${board[1] ?? " "} | ${board[2] ?? " "}`,
		"---------",
		`${board[3] ?? " "} | ${board[4] ?? " "} | ${board[5] ?? " "}`,
		"---------",
		`${board[6] ?? " "} | ${board[7] ?? " "} | ${board[8] ?? " "}`,
	].join("\n");

	const availablePositions = legalMoves
		.map((move) => (move.position as number).toString())
		.join(", ");

	return `You are playing Tic-Tac-Toe as player ${playerId}.

Board (positions 0-8):
${boardDisplay}

Available moves: ${availablePositions}

Respond with valid JSON: {"position": <number>}
Example: {"position": 4}`;
}

/**
 * Format a prompt for Connect Four
 */
function formatConnectFourPrompt(
	state: SerializedState,
	legalMoves: Move[],
	playerId: PlayerId,
): string {
	const board = (state as { board: (PlayerId | null)[][] }).board;

	// Convert board to visual representation (rows from top to bottom)
	const boardDisplay = board
		.map((row, rowIdx) => {
			if (!row) return "";
			const rowStr = row.map((cell) => (cell ?? ".").padEnd(2)).join(" ");
			return `Row ${rowIdx}: ${rowStr}`;
		})
		.join("\n");

	const availableColumns = legalMoves
		.map((move) => (move.column as number).toString())
		.join(", ");

	return `You are playing Connect Four as player ${playerId}.

Board (columns 0-6):
${boardDisplay}

Available moves: ${availableColumns}

Respond with valid JSON: {"column": <number>}
Example: {"column": 3}`;
}

/**
 * Format a prompt for Chess
 */
function formatChessPrompt(
	state: SerializedState,
	legalMoves: Move[],
	playerId: PlayerId,
): string {
	const fen = (state as { fen: string }).fen;

	// Format legal moves for display
	const moveDescriptions = legalMoves
		.map((move, idx) => {
			const from = (move.from as string).toUpperCase();
			const to = (move.to as string).toUpperCase();
			const promotion = move.promotion ? ` (${move.promotion})` : "";
			return `${idx + 1}. ${from}-${to}${promotion}`;
		})
		.join(", ");

	return `You are playing Chess as player ${playerId === "X" ? "White" : "Black"}.

FEN: ${fen}

Legal moves: ${moveDescriptions}

Respond with valid JSON: {"from": "<square>", "to": "<square>"}
With promotion: {"from": "<square>", "to": "<square>", "promotion": "q"|"r"|"b"|"n"}
Example: {"from": "e2", "to": "e4"}`;
}

/**
 * Get prompt formatter for a game type
 */
export function getPromptFormatter(gameType: GameType) {
	switch (gameType) {
		case GameType.ticTacToe:
			return formatTicTacToePrompt;
		case GameType.connectFour:
			return formatConnectFourPrompt;
		case GameType.chess:
			return formatChessPrompt;
		default:
			throw new Error(`No prompt formatter for game type: ${gameType}`);
	}
}
