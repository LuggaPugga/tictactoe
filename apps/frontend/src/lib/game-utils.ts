import type { CellValue, LocalBoard } from "@/lib/types";

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
