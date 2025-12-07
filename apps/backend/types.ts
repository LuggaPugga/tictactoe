export interface Player {
	sessionCode: string;
	name: string;
	connected: boolean;
}

export interface Spectator {
	sessionCode: string;
	name: string;
}

export interface Score {
	wins: number;
	losses: number;
	ties: number;
}

export interface GameRoom {
	players: Player[];
	spectators: Spectator[];
	game: (string | null)[][];
	globalBoard: (string | null)[];
	currentBoard: number | null;
	currentTurn: string | null;
	scores: Record<string, Score>;
	winner: string | null;
	status: "waiting" | "playing";
}

export type CellValue = "X" | "O" | null;

export interface GameStateData {
	players: Player[];
	game: (string | null)[][];
	globalBoard: (string | null)[];
	currentBoard: number | null;
	currentTurn: string | null;
	scores: Record<string, Score>;
	status: string;
	spectators: Spectator[];
	winner?: string | null;
}
