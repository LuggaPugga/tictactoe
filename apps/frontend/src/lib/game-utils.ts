import type { CellValue, Game, LocalBoard, Score } from "@/lib/types";

const WINNING_COMBOS = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
] as const;

export function checkWinner(board: LocalBoard): CellValue | "tie" | null {
	for (const [a, b, c] of WINNING_COMBOS) {
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return board[a];
		}
	}
	return board.every((cell) => cell !== null) ? "tie" : null;
}

export function isBoardFull(board: LocalBoard): boolean {
	return board.every((cell) => cell !== null);
}

export function createEmptyGame(): Game {
	return Array.from({ length: 9 }, () => Array(9).fill(null));
}

export function createEmptyGlobalBoard(): LocalBoard {
	return Array(9).fill(null);
}

export function placeMove(
	game: Game,
	boardIndex: number,
	cellIndex: number,
	mark: CellValue,
): Game {
	return game.map((board, i) =>
		i === boardIndex
			? board.map((cell, j) => (j === cellIndex ? mark : cell))
			: board,
	);
}

export function computeNextBoard(
	game: Game,
	globalBoard: LocalBoard,
	cellIndex: number,
): number | null {
	const targetBoard = game[cellIndex];
	if (
		!targetBoard ||
		isBoardFull(targetBoard) ||
		globalBoard[cellIndex] !== null
	) {
		return null;
	}
	return cellIndex;
}

export function updateScores(
	scores: Record<string, Score>,
	winnerCode: string | null,
	loserCode: string,
): Record<string, Score> {
	const updated = { ...scores };
	const winnerScore = updated[winnerCode ?? ""] ?? {
		wins: 0,
		losses: 0,
		ties: 0,
	};
	const loserScore = updated[loserCode] ?? { wins: 0, losses: 0, ties: 0 };

	if (winnerCode === null) {
		updated.player1 = { ...updated.player1, ties: updated.player1.ties + 1 };
		updated.player2 = { ...updated.player2, ties: updated.player2.ties + 1 };
	} else {
		updated[winnerCode] = { ...winnerScore, wins: winnerScore.wins + 1 };
		updated[loserCode] = { ...loserScore, losses: loserScore.losses + 1 };
	}
	return updated;
}
