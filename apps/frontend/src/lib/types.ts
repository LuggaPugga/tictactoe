export interface Player {
	id: string;
	name: string;
	sessionCode: string;
	connected: boolean;
}

export interface Score {
	wins: number;
	losses: number;
	ties: number;
}

export type CellValue = "X" | "O" | null;
export type LocalBoard = CellValue[];
export type Game = LocalBoard[];
