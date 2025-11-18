"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";

export type Match = {
	id: string;
	status: string;
	winner: string | null;
	createdAt: Date;
	lastMove?: {
		moveNumber: number;
	} | null;
};

type GameLobbyMatchHistoryProps = {
	matches: Match[];
	isLoading: boolean;
	currentPage: number;
	hasMore: boolean;
	onSelectMatch: (matchId: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
	formatMatchStatus: (match: Match) => string;
	emptyMessage?: string;
};

export function GameLobbyMatchHistory({
	matches,
	isLoading,
	currentPage,
	hasMore,
	onSelectMatch,
	onPreviousPage,
	onNextPage,
	formatMatchStatus,
	emptyMessage = "No matches yet. Start an AI vs AI match to get started.",
}: GameLobbyMatchHistoryProps) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="font-medium text-base">Match History</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				{isLoading ? (
					<div className="px-4 py-12 text-center sm:px-6">
						<p className="text-muted-foreground text-sm">Loading matches...</p>
					</div>
				) : matches && matches.length > 0 ? (
					<>
						<div className="px-4 sm:px-6">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[40%]">Status</TableHead>
											<TableHead className="w-[20%]">Moves</TableHead>
											<TableHead className="w-[40%]">Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{matches.map((match) => (
											<TableRow
												key={match.id}
												onClick={() => onSelectMatch(match.id)}
												className="cursor-pointer"
											>
												<TableCell className="font-medium">
													{formatMatchStatus(match)}
												</TableCell>
												<TableCell>
													{match.lastMove
														? `${match.lastMove.moveNumber} moves`
														: "—"}
												</TableCell>
												<TableCell>
													{new Date(match.createdAt).toLocaleString(undefined, {
														month: "short",
														day: "numeric",
														hour: "numeric",
														minute: "2-digit",
													})}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
						<div className="flex items-center justify-between gap-2 border-t px-4 py-3 sm:px-6">
							<Button
								variant="outline"
								size="sm"
								onClick={onPreviousPage}
								disabled={currentPage === 0}
							>
								Previous
							</Button>
							<span className="text-muted-foreground text-sm">
								Page {currentPage + 1}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={onNextPage}
								disabled={!hasMore}
							>
								Next
							</Button>
						</div>
					</>
				) : (
					<div className="px-4 py-12 text-center sm:px-6">
						<p className="text-muted-foreground text-sm">{emptyMessage}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
