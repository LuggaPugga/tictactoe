import { createStore, type SetStoreFunction } from "solid-js/store";
import type { Game, LocalBoard, Player, Score } from "./types";

export interface GameState {
	game: Game;
	globalBoard: LocalBoard;
	currentBoard: number | null;
	players: Player[];
	currentTurn: string | null;
	gameStatus: "waiting" | "playing" | "over" | "interrupted";
	roomStatus: "waiting" | "playing" | "full" | "notFound";
	winner: string | null;
	scores: Record<string, Score>;
}

const initialState: GameState = {
	game: Array.from({ length: 9 }, () => Array(9).fill(null)),
	globalBoard: Array(9).fill(null),
	currentBoard: null,
	players: [],
	currentTurn: null,
	gameStatus: "waiting",
	roomStatus: "waiting",
	winner: null,
	scores: {},
};

export function createGameStore() {
	const [state, setState] = createStore<GameState>(
		structuredClone(initialState),
	);

	return {
		state,
		set: setState as SetStoreFunction<GameState>,
		reset: () => setState(structuredClone(initialState)),
	};
}
