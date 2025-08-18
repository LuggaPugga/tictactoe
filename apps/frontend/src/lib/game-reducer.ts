import type { Game, LocalBoard, Player, Score } from "@/lib/types";

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

export type GameAction =
	| { type: "GAME_START"; players: Player[]; currentTurn: string }
	| {
			type: "MAKE_MOVE";
			boardIndex: number;
			cellIndex: number;
			playerId: string;
	  }
	| {
			type: "UPDATE_GAME";
			game: Game;
			globalBoard: LocalBoard;
			currentBoard: number | null;
			currentTurn: string | null;
			scores: Record<string, Score>;
			winner?: string | null;
	  }
	| { type: "SET_WINNER"; winner: string }
	| { type: "RESET_GAME" }
	| { type: "UPDATE_PLAYERS"; players: Player[] }
	| { type: "PLAYER_DISCONNECTED"; sessionCode: string }
	| { type: "PLAYER_RECONNECTED"; sessionCode: string }
	| { type: "SET_CURRENT_BOARD"; currentBoard: number | null }
	| {
			type: "SET_GAME_STATUS";
			status: "waiting" | "playing" | "over" | "interrupted";
	  }
	| {
			type: "SET_ROOM_STATUS";
			status: "waiting" | "playing" | "full" | "notFound";
	  }
	| {
			type: "RECONNECTED";
			game: Game;
			globalBoard: LocalBoard;
			currentBoard: number | null;
			currentTurn: string | null;
			players: Player[];
			scores: Record<string, Score>;
			winner: string | null;
			status: "waiting" | "playing" | "over" | "interrupted";
	  };

export const initialGameState: GameState = {
	game: Array(9).fill(Array(9).fill(null)),
	globalBoard: Array(9).fill(null),
	currentBoard: null,
	players: [],
	currentTurn: null,
	gameStatus: "waiting",
	roomStatus: "waiting",
	winner: null,
	scores: {},
};

export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case "GAME_START":
			return {
				...state,
				players: action.players,
				currentTurn: action.currentTurn,
				gameStatus: "playing",
				winner: null,
			};

		case "UPDATE_GAME":
			return {
				...state,
				game: action.game,
				globalBoard: action.globalBoard,
				currentBoard: action.currentBoard,
				currentTurn: action.currentTurn,
				scores: action.scores,
				...(action.winner !== undefined && {
					winner: action.winner,
					gameStatus: action.winner ? "over" : "playing",
				}),
			};

		case "SET_WINNER":
			return {
				...state,
				winner: action.winner,
				gameStatus: "over",
			};

		case "RESET_GAME":
			return {
				...state,
				game: Array(9).fill(Array(9).fill(null)),
				globalBoard: Array(9).fill(null),
				currentBoard: null,
				gameStatus: "playing",
				winner: null,
			};

		case "UPDATE_PLAYERS":
			return {
				...state,
				players: action.players,
			};

		case "PLAYER_DISCONNECTED":
			return {
				...state,
				players: state.players.map((player) =>
					player.sessionCode === action.sessionCode
						? { ...player, connected: false }
						: player,
				),
			};

		case "PLAYER_RECONNECTED":
			return {
				...state,
				players: state.players.map((player) =>
					player.sessionCode === action.sessionCode
						? { ...player, connected: true }
						: player,
				),
			};

		case "SET_CURRENT_BOARD":
			return {
				...state,
				currentBoard: action.currentBoard,
			};

		case "SET_GAME_STATUS":
			return {
				...state,
				gameStatus: action.status,
			};

		case "SET_ROOM_STATUS":
			return {
				...state,
				roomStatus: action.status,
			};

		case "RECONNECTED":
			return {
				...state,
				game: action.game,
				globalBoard: action.globalBoard,
				currentBoard: action.currentBoard,
				currentTurn: action.currentTurn,
				players: action.players.map((player: Player) => ({
					...player,
					connected: true,
				})),
				scores: action.scores,
				winner: action.winner,
				gameStatus: action.winner ? "over" : "playing",
			};

		default:
			return state;
	}
}
