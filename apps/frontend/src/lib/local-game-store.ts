import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import {
	checkWinner,
	computeNextBoard,
	createEmptyGame,
	createEmptyGlobalBoard,
	isBoardFull,
	placeMove,
	updateScores,
} from "./game-utils";
import type { CellValue, Game, LocalBoard, Player, Score } from "./types";

export interface LocalGameState {
	players: Player[];
	currentTurn: string | null;
	game: Game;
	globalBoard: LocalBoard;
	currentBoard: number | null;
	scores: Record<string, Score>;
	winner: string | null;
	status: "waiting" | "playing" | "over";
}

const PLAYER_1 = "player1";
const PLAYER_2 = "player2";

function createPlayer(
	id: "X" | "O",
	name: string,
	sessionCode: string,
): Player {
	return { id, name, sessionCode, connected: true };
}

function createInitialScores(): Record<string, Score> {
	return {
		[PLAYER_1]: { wins: 0, losses: 0, ties: 0 },
		[PLAYER_2]: { wins: 0, losses: 0, ties: 0 },
	};
}

function createInitialState(): LocalGameState {
	return {
		players: [],
		currentTurn: null,
		game: createEmptyGame(),
		globalBoard: createEmptyGlobalBoard(),
		currentBoard: null,
		scores: {},
		winner: null,
		status: "waiting",
	};
}

export function createLocalGameStore() {
	const [state, setState] = createStore<LocalGameState>(createInitialState());

	const [savedGame, setSavedGame] = makePersisted(
		createSignal<LocalGameState | null>(null),
		{
			name: "ticTacToeGame",
			storage:
				typeof sessionStorage !== "undefined" ? sessionStorage : undefined,
		},
	);

	function persist() {
		setSavedGame(structuredClone(state));
	}

	function loadSavedGame(): boolean {
		const saved = savedGame();
		if (saved && state.status === "waiting") {
			setState(saved);
			return true;
		}
		return false;
	}

	function startGame(player1Name: string, player2Name: string) {
		setState({
			players: [
				createPlayer("X", player1Name, PLAYER_1),
				createPlayer("O", player2Name, PLAYER_2),
			],
			currentTurn: PLAYER_1,
			game: createEmptyGame(),
			globalBoard: createEmptyGlobalBoard(),
			currentBoard: null,
			scores: createInitialScores(),
			winner: null,
			status: "playing",
		});
	}

	function isValidMove(boardIndex: number, cellIndex: number): boolean {
		if (state.status !== "playing" || state.winner) return false;

		const board = state.game[boardIndex];
		if (!board || board[cellIndex] !== null) return false;

		const targetBoard =
			state.currentBoard !== null ? state.game[state.currentBoard] : null;
		return (
			state.currentBoard === null ||
			state.currentBoard === boardIndex ||
			(targetBoard !== null && isBoardFull(targetBoard))
		);
	}

	function makeMove(boardIndex: number, cellIndex: number): boolean {
		if (!isValidMove(boardIndex, cellIndex)) return false;

		const currentPlayer = state.players.find(
			(p) => p.sessionCode === state.currentTurn,
		);
		if (!currentPlayer) return false;

		const mark = currentPlayer.id as CellValue;
		const newGame = placeMove(state.game, boardIndex, cellIndex, mark);
		const newGlobalBoard = [...state.globalBoard] as LocalBoard;

		const updatedBoard = newGame[boardIndex];
		if (updatedBoard) {
			const localResult = checkWinner(updatedBoard);
			if (localResult && localResult !== "tie") {
				newGlobalBoard[boardIndex] = localResult;
			}
		}

		const nextBoard = computeNextBoard(newGame, newGlobalBoard, cellIndex);
		const globalResult = checkWinner(newGlobalBoard);
		const opponent = state.currentTurn === PLAYER_1 ? PLAYER_2 : PLAYER_1;

		if (globalResult) {
			const winnerCode =
				globalResult === "tie" ? null : currentPlayer.sessionCode;
			setState({
				game: newGame,
				globalBoard: newGlobalBoard,
				currentBoard: nextBoard,
				scores: updateScores(state.scores, winnerCode, opponent),
				winner: winnerCode,
				status: "over",
			});
			persist();
			return true;
		}

		setState({
			game: newGame,
			globalBoard: newGlobalBoard,
			currentBoard: nextBoard,
			currentTurn: opponent,
		});
		persist();
		return false;
	}

	function playAgain() {
		setState({
			game: createEmptyGame(),
			globalBoard: createEmptyGlobalBoard(),
			currentBoard: null,
			winner: null,
			status: "playing",
			currentTurn: PLAYER_1,
		});
	}

	function reset() {
		setSavedGame(null);
		setState(createInitialState());
	}

	function getWinnerName(): string {
		if (!state.winner) return "";
		return (
			state.players.find((p) => p.sessionCode === state.winner)?.name ?? ""
		);
	}

	return {
		state,
		loadSavedGame,
		startGame,
		makeMove,
		playAgain,
		reset,
		getWinnerName,
	};
}
