"use client";

import { Chess } from "chess.js";
import type { Key } from "chessground/types";
import Chessground from "react-chessground";
import "react-chessground/dist/styles/chessground.css";
import { type Turn, TurnStatus } from "~/shared/@types";

type Props = {
	turns: Turn[];
	currentStep?: number;
	initialFen?: string;
};

export function ChessBoard({
	turns,
	currentStep,
	initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
}: Props) {
	// If currentStep is provided, show board state at that step (for replay)
	// Otherwise show all successful moves (for live view)
	const turnsToApply =
		currentStep !== undefined
			? turns
					.slice(0, currentStep)
					.filter((t) => t.status === TurnStatus.success)
			: turns.filter((t) => t.status === TurnStatus.success);

	// Reconstruct board from moves
	const chess = new Chess(initialFen);

	for (const turn of turnsToApply) {
		if ("from" in turn.move && "to" in turn.move) {
			try {
				chess.move({
					from: turn.move.from as string,
					to: turn.move.to as string,
					promotion: ("promotion" in turn.move
						? turn.move.promotion
						: undefined) as "q" | "r" | "b" | "n" | undefined,
				});
			} catch (e) {
				console.error("Failed to apply chess move:", turn.move, e);
			}
		}
	}

	const currentFen = chess.fen();

	// Get last move for highlighting
	const lastMove = turnsToApply[turnsToApply.length - 1];
	const lastMoveSquares: Key[] | undefined =
		lastMove && "from" in lastMove.move && "to" in lastMove.move
			? [lastMove.move.from as Key, lastMove.move.to as Key]
			: undefined;

	return (
		<div className="mx-auto w-full max-w-[480px]">
			<div className="aspect-square w-full">
				<Chessground
					fen={currentFen}
					viewOnly={true}
					turnColor={chess.turn() === "w" ? "white" : "black"}
					check={chess.inCheck()}
					lastMove={lastMoveSquares}
					width="100%"
					height="100%"
				/>
			</div>
		</div>
	);
}
