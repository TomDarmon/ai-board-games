/**
 * Prompt formatting helpers for different game types
 */

import { Chess, type Square } from "chess.js";
import { GameType, type PlayerId } from "~/drizzle/schema";
import type { Move, SerializedState } from "~/shared/@types";

// Piece values for material evaluation
const PIECE_VALUES: Record<string, number> = {
	p: 1,
	n: 3,
	b: 3,
	r: 5,
	q: 9,
	k: 0,
};

// Unicode chess pieces for visual representation
const PIECE_SYMBOLS: Record<string, string> = {
	K: "♔",
	Q: "♕",
	R: "♖",
	B: "♗",
	N: "♘",
	P: "♙",
	k: "♚",
	q: "♛",
	r: "♜",
	b: "♝",
	n: "♞",
	p: "♟",
};

/**
 * Calculate material balance
 */
function getMaterialBalance(game: Chess): {
	white: number;
	black: number;
	balance: number;
} {
	const board = game.board();
	let white = 0;
	let black = 0;

	for (const row of board) {
		for (const piece of row) {
			if (piece) {
				const value = PIECE_VALUES[piece.type] ?? 0;
				if (piece.color === "w") {
					white += value;
				} else {
					black += value;
				}
			}
		}
	}

	return { white, black, balance: white - black };
}

/**
 * Get pieces that are hanging (attacked but not defended)
 */
function getHangingPieces(
	game: Chess,
	color: "w" | "b",
): Array<{ square: string; piece: string; value: number }> {
	const hanging: Array<{ square: string; piece: string; value: number }> = [];
	const opponentColor = color === "w" ? "b" : "w";
	const board = game.board();

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const piece = board[row]?.[col];
			if (piece && piece.color === color && piece.type !== "k") {
				const file = String.fromCharCode(97 + col);
				const rank = String(8 - row);
				const square = `${file}${rank}` as Square;

				// Check if attacked by opponent
				if (game.isAttacked(square, opponentColor)) {
					// Check if defended by our pieces
					if (!game.isAttacked(square, color)) {
						hanging.push({
							square,
							piece: piece.type.toUpperCase(),
							value: PIECE_VALUES[piece.type] ?? 0,
						});
					}
				}
			}
		}
	}

	return hanging;
}

/**
 * Render ASCII board with coordinates
 */
function renderAsciiBoard(game: Chess, perspective: "w" | "b"): string {
	const board = game.board();
	const lines: string[] = [];

	// Column labels
	const files =
		perspective === "w"
			? ["a", "b", "c", "d", "e", "f", "g", "h"]
			: ["h", "g", "f", "e", "d", "c", "b", "a"];

	lines.push(`    ${files.map((f) => ` ${f} `).join("")}`);
	lines.push(`  ┌${"───┬".repeat(7)}───┐`);

	const rowRange =
		perspective === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

	for (let i = 0; i < 8; i++) {
		const row = rowRange[i] ?? 0;
		const rank = 8 - row;
		const cols =
			perspective === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

		const rowPieces = cols.map((col) => {
			const piece = board[row]?.[col];
			if (piece) {
				const symbol =
					PIECE_SYMBOLS[
						piece.color === "w" ? piece.type.toUpperCase() : piece.type
					];
				return ` ${symbol} `;
			}
			return " · ";
		});

		lines.push(`${rank} │${rowPieces.join("│")}│ ${rank}`);

		if (i < 7) {
			lines.push(`  ├${"───┼".repeat(7)}───┤`);
		}
	}

	lines.push(`  └${"───┴".repeat(7)}───┘`);
	lines.push(`    ${files.map((f) => ` ${f} `).join("")}`);

	return lines.join("\n");
}

/**
 * Get tactical information about the position
 */
function getTacticalAnalysis(game: Chess, playerColor: "w" | "b"): string {
	const analysis: string[] = [];
	const opponentColor = playerColor === "w" ? "b" : "w";

	// Check status
	if (game.isCheck()) {
		analysis.push("⚠️ YOUR KING IS IN CHECK - you must address this!");
	}

	// Material balance
	const material = getMaterialBalance(game);
	if (material.balance !== 0) {
		const advantage =
			playerColor === "w" ? material.balance : -material.balance;
		if (advantage > 0) {
			analysis.push(`📈 You are ahead by ${advantage} point(s) of material`);
		} else {
			analysis.push(
				`📉 You are behind by ${Math.abs(advantage)} point(s) of material`,
			);
		}
	} else {
		analysis.push("⚖️ Material is equal");
	}

	// Hanging pieces (yours)
	const yourHanging = getHangingPieces(game, playerColor);
	if (yourHanging.length > 0) {
		const hangingList = yourHanging
			.map((h) => `${h.piece} on ${h.square} (${h.value}pts)`)
			.join(", ");
		analysis.push(
			`🚨 YOUR HANGING PIECES (undefended & attacked): ${hangingList}`,
		);
	}

	// Hanging pieces (opponent's)
	const theirHanging = getHangingPieces(game, opponentColor);
	if (theirHanging.length > 0) {
		const hangingList = theirHanging
			.map((h) => `${h.piece} on ${h.square} (${h.value}pts)`)
			.join(", ");
		analysis.push(
			`🎯 OPPONENT'S HANGING PIECES (capture opportunity!): ${hangingList}`,
		);
	}

	return analysis.join("\n");
}

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
 *
 * Example output:
 *
 * You are playing Chess as White (X).
 *
 * ═══════════════════════════════════════
 * CURRENT BOARD (from your perspective):
 * ═══════════════════════════════════════
 *      a  b  c  d  e  f  g  h
 *   ┌───┬───┬───┬───┬───┬───┬───┬───┐
 * 8 │ ♜ │ ♞ │ ♝ │ ♛ │ ♚ │ ♝ │ ♞ │ ♜ │ 8
 *   ├───┼───┼───┼───┼───┼───┼───┼───┤
 * 7 │ ♟ │ ♟ │ ♟ │ ♟ │ ♟ │ ♟ │ ♟ │ ♟ │ 7
 *   ├───┼───┼───┼───┼───┼───┼───┼───┤
 * 6 │ · │ · │ · │ · │ · │ · │ · │ · │ 6
 *   ├───┼───┼───┼───┼───┼───┼───┼───┤
 * 5 │ · │ · │ · │ · │ · │ · │ · │ · │ 5
 *   ├───┼───┼───┼───┼───┼───┼───┼───┤
 * 4 │ · │ · │ · │ · │ · │ · │ · │ · │ 4
 *   ├───┼───┼───┼───┼───┼───┼───┼───┤
 * 3 │ · │ · │ · │ · │ · │ · │ · │ · │ 3
 *   ├───┼───┼───┼───┼───┼───┼───┼───┤
 * 2 │ ♙ │ ♙ │ ♙ │ ♙ │ ♙ │ ♙ │ ♙ │ ♙ │ 2
 *   ├───┼───┼───┼───┼───┼───┼───┼───┤
 * 1 │ ♖ │ ♘ │ ♗ │ ♕ │ ♔ │ ♗ │ ♘ │ ♖ │ 1
 *   └───┴───┴───┴───┴───┴───┴───┴───┘
 *      a  b  c  d  e  f  g  h
 *
 * Legend: ♔♕♖♗♘♙ = White pieces, ♚♛♜♝♞♟ = Black pieces
 *
 * ═══════════════════════════════════════
 * POSITION ANALYSIS:
 * ═══════════════════════════════════════
 * ⚖️ Material is equal
 *
 * ═══════════════════════════════════════
 * LEGAL MOVES (20 available):
 * ═══════════════════════════════════════
 * 📍 OTHER MOVES:
 * a2-a3, a2-a4, b2-b3, b2-b4, c2-c3, c2-c4, d2-d3, d2-d4, e2-e3, e2-e4, f2-f3, f2-f4, g2-g3, g2-g4, h2-h3, h2-h4, b1-a3, b1-c3, g1-f3, g1-h3
 *
 * ═══════════════════════════════════════
 * FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
 * ═══════════════════════════════════════
 *
 * STRATEGIC TIPS:
 * - Prioritize capturing hanging pieces (free material)
 * - Protect your hanging pieces if any
 * - Develop pieces toward the center
 * - Castle early for king safety
 * - Look for checks that win material
 *
 * Respond with valid JSON: {"from": "<square>", "to": "<square>"}
 * With promotion: {"from": "<square>", "to": "<square>", "promotion": "q"|"r"|"b"|"n"}
 * Example: {"from": "e2", "to": "e4"}
 */
function formatChessPrompt(
	state: SerializedState,
	legalMoves: Move[],
	playerId: PlayerId,
): string {
	const fen = (state as { fen: string }).fen;
	const game = new Chess(fen);
	const playerColor = playerId === "X" ? "w" : "b";
	const colorName = playerColor === "w" ? "White" : "Black";

	// Render the board from player's perspective
	const boardDisplay = renderAsciiBoard(game, playerColor);

	// Get tactical analysis
	const tacticalInfo = getTacticalAnalysis(game, playerColor);

	// Categorize moves by type for clearer presentation
	const captures: string[] = [];
	const checks: string[] = [];
	const castling: string[] = [];
	const defendedMoves: string[] = [];
	const regularMoves: string[] = [];

	for (const move of legalMoves) {
		const from = move.from as string;
		const to = move.to as string;
		const promotion = move.promotion ? `=${move.promotion}` : "";

		// Try the move to see what it does
		const testGame = new Chess(fen);
		const result = testGame.move({
			from: from as Square,
			to: to as Square,
			promotion: move.promotion as "q" | "r" | "b" | "n" | undefined,
		});

		if (result) {
			const moveStr = `${from}-${to}${promotion}`;

			if (result.san.includes("O-O")) {
				castling.push(result.san);
			} else if (result.captured) {
				const capturedPiece = result.captured.toUpperCase();
				const captureValue = PIECE_VALUES[result.captured] ?? 0;
				captures.push(
					`${moveStr} (captures ${capturedPiece}, ${captureValue}pts)`,
				);
			} else if (testGame.isCheck()) {
				checks.push(`${moveStr} (gives check)`);
			} else {
				// Check if destination square is defended
				if (testGame.isAttacked(to as Square, playerColor)) {
					defendedMoves.push(`${moveStr} (defended)`);
				} else {
					regularMoves.push(moveStr);
				}
			}
		}
	}

	// Build moves section
	const movesSections: string[] = [];

	if (captures.length > 0) {
		movesSections.push(`🗡️ CAPTURES:\n${captures.join(", ")}`);
	}
	if (checks.length > 0) {
		movesSections.push(`⚡ CHECKS:\n${checks.join(", ")}`);
	}
	if (castling.length > 0) {
		movesSections.push(`🏰 CASTLING:\n${castling.join(", ")}`);
	}
	if (defendedMoves.length > 0) {
		movesSections.push(`🛡️ DEFENDED MOVES:\n${defendedMoves.join(", ")}`);
	}
	if (regularMoves.length > 0) {
		// Group regular moves by piece for readability
		movesSections.push(`📍 OTHER MOVES:\n${regularMoves.join(", ")}`);
	}

	const movesDisplay = movesSections.join("\n\n");

	return `You are playing Chess as ${colorName} (${playerId}).

═══════════════════════════════════════
CURRENT BOARD (from your perspective):
═══════════════════════════════════════
${boardDisplay}

Legend: ♔♕♖♗♘♙ = White pieces, ♚♛♜♝♞♟ = Black pieces

═══════════════════════════════════════
POSITION ANALYSIS:
═══════════════════════════════════════
${tacticalInfo}

═══════════════════════════════════════
LEGAL MOVES (${legalMoves.length} available):
═══════════════════════════════════════
${movesDisplay}

═══════════════════════════════════════
FEN: ${fen}
═══════════════════════════════════════

STRATEGIC TIPS:
- Capture opponent's pieces to win material
- Coordinate your pieces to attack the same squares
- Never leave your pieces hanging (undefended and under attack)
- Move pieces to defended squares whenever possible
- Develop pieces toward the center
- Do not touch the same pieces twice until multiple pieces are developed

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
