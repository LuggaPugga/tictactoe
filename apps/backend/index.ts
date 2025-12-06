import { cors } from "@elysiajs/cors";
import { Elysia, t } from "elysia";
import type { GameRoom, Spectator } from "./types";

const rooms = new Map<string, GameRoom>();

interface QueuePlayer {
	sessionCode: string;
	playerName: string;
}

const queue: QueuePlayer[] = [];
const MAX_QUEUE_SIZE = 100;

interface WebSocketData {
	sessionCode: string;
	roomCode: string | null;
	inQueue: boolean;
}

type ElysiaWebSocket = {
	send: (data: string) => void;
	data: WebSocketData & Record<string, unknown>;
};

const sessionToWs = new Map<string, ElysiaWebSocket>();
const roomSubscribers = new Map<string, Set<string>>();

function checkWinner(board: (string | null)[]): string | null {
	const winningCombos = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	] as const;

	for (const combo of winningCombos) {
		const [a, b, c] = combo;
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return board[a];
		}
	}

	return board.every((cell) => cell !== null) ? "tie" : null;
}

function createRoom(): GameRoom {
	return {
		players: [],
		spectators: [],
		game: Array(9)
			.fill(null)
			.map(() => Array(9).fill(null)),
		globalBoard: Array(9).fill(null),
		currentBoard: null,
		currentTurn: null,
		scores: {},
		winner: null,
		status: "waiting",
	};
}

function updateScores(
	room: GameRoom,
	winner: string,
	sessionCode: string,
): void {
	if (winner === "tie") {
		for (const player of room.players) {
			room.scores[player.sessionCode].ties++;
		}
	} else {
		const winningPlayer = room.players.find(
			(player) => player.sessionCode === sessionCode,
		);
		const losingPlayer = room.players.find(
			(player) => player.sessionCode !== sessionCode,
		);
		if (winningPlayer && losingPlayer) {
			room.scores[winningPlayer.sessionCode].wins++;
			room.scores[losingPlayer.sessionCode].losses++;
		}
	}
}

function broadcast(roomCode: string, message: object) {
	const subscribers = roomSubscribers.get(roomCode);
	if (!subscribers) return;

	for (const sessionCode of subscribers) {
		const ws = sessionToWs.get(sessionCode);
		if (ws) {
			try {
				ws.send(JSON.stringify(message));
			} catch (_e) {}
		}
	}
}

function subscribeToRoom(roomCode: string, sessionCode: string) {
	if (!roomSubscribers.has(roomCode)) {
		roomSubscribers.set(roomCode, new Set());
	}
	roomSubscribers.get(roomCode)?.add(sessionCode);
}

function unsubscribeFromRoom(roomCode: string, sessionCode: string) {
	roomSubscribers.get(roomCode)?.delete(sessionCode);
}

function generateSessionCode(): string {
	return Math.random().toString(36).substring(2, 15);
}

function generateRoomCode(): string {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const app = new Elysia()
	.use(cors())
	.post("/api/create-room", () => {
		const roomCode = generateRoomCode();
		rooms.set(roomCode, createRoom());
		return { roomCode };
	})
	.ws("/game", {
		body: t.Object({
			type: t.String(),
			roomCode: t.Optional(t.String()),
			playerName: t.Optional(t.String()),
			sessionCode: t.Optional(t.String()),
			asSpectator: t.Optional(t.Boolean()),
			boardIndex: t.Optional(t.Number()),
			cellIndex: t.Optional(t.Number()),
		}),
		open(ws) {
			const sessionCode = generateSessionCode();
			const wsData = ws.data as unknown as WebSocketData;
			wsData.sessionCode = sessionCode;
			wsData.roomCode = null;
			wsData.inQueue = false;
			sessionToWs.set(sessionCode, ws as unknown as ElysiaWebSocket);

			ws.send(
				JSON.stringify({
					type: "connected",
					sessionCode,
				}),
			);
		},
		message(ws, data) {
			const { type } = data;
			const wsData = ws.data as unknown as WebSocketData;
			const currentSessionCode = wsData.sessionCode;

			switch (type) {
				case "joinQueue": {
					const { playerName } = data;
					if (!playerName) return;

					if (wsData.inQueue) {
						const index = queue.findIndex(
							(p) => p.sessionCode === currentSessionCode,
						);
						if (index !== -1) {
							queue.splice(index, 1);
						}
					}

					wsData.inQueue = true;
					if (queue.length >= MAX_QUEUE_SIZE) {
						ws.send(JSON.stringify({ type: "queueFull" }));
						wsData.inQueue = false;
						return;
					}

					queue.push({ sessionCode: currentSessionCode, playerName });
					ws.send(
						JSON.stringify({ type: "joinedQueue", position: queue.length }),
					);

					for (let i = 0; i < queue.length; i++) {
						const qWs = sessionToWs.get(queue[i].sessionCode);
						if (qWs) {
							qWs.send(
								JSON.stringify({ type: "queueUpdate", position: i + 1 }),
							);
						}
					}

					if (queue.length >= 2) {
						const player1 = queue.shift();
						const player2 = queue.shift();
						if (!player1 || !player2) break;

						const roomCode = generateRoomCode();
						const room = createRoom();
						rooms.set(roomCode, room);

						[player1, player2].forEach((player) => {
							room.players.push({
								sessionCode: player.sessionCode,
								name: player.playerName,
								connected: true,
							});
							room.scores[player.sessionCode] = { wins: 0, losses: 0, ties: 0 };
							subscribeToRoom(roomCode, player.sessionCode);

							const pWs = sessionToWs.get(player.sessionCode);
							if (pWs) {
								const pWsData = pWs.data as unknown as WebSocketData;
								pWsData.roomCode = roomCode;
								pWsData.inQueue = false;
								pWs.send(JSON.stringify({ type: "leftQueue" }));
								pWs.send(
									JSON.stringify({
										type: "lobbyCreated",
										roomCode,
										sessionCode: player.sessionCode,
									}),
								);
							}
						});

						room.currentTurn = room.players[0].sessionCode;
						room.status = "playing";

						broadcast(roomCode, {
							type: "gameStart",
							players: room.players,
							game: room.game,
							globalBoard: room.globalBoard,
							currentBoard: room.currentBoard,
							currentTurn: room.currentTurn,
							scores: room.scores,
							status: room.status,
							spectators: room.spectators,
						});

						for (let i = 0; i < queue.length; i++) {
							const qWs = sessionToWs.get(queue[i].sessionCode);
							if (qWs) {
								qWs.send(
									JSON.stringify({ type: "queueUpdate", position: i + 1 }),
								);
							}
						}
					}
					break;
				}

				case "leaveQueue": {
					if (wsData.inQueue) {
						const index = queue.findIndex(
							(p) => p.sessionCode === currentSessionCode,
						);
						if (index !== -1) {
							queue.splice(index, 1);
							ws.send(JSON.stringify({ type: "leftQueue" }));

							for (let i = 0; i < queue.length; i++) {
								const qWs = sessionToWs.get(queue[i].sessionCode);
								if (qWs) {
									qWs.send(
										JSON.stringify({ type: "queueUpdate", position: i + 1 }),
									);
								}
							}
						}
						wsData.inQueue = false;
					}
					break;
				}

				case "joinRoom": {
					const {
						roomCode,
						playerName,
						sessionCode: providedSessionCode,
						asSpectator,
					} = data;
					if (!roomCode || !playerName) return;

					if (wsData.inQueue) {
						const index = queue.findIndex(
							(p) => p.sessionCode === currentSessionCode,
						);
						if (index !== -1) {
							queue.splice(index, 1);
							ws.send(JSON.stringify({ type: "leftQueue" }));
						}
						wsData.inQueue = false;
					}

					const room = rooms.get(roomCode);
					if (!room) {
						ws.send(JSON.stringify({ type: "roomNotFound" }));
						return;
					}

					if (
						providedSessionCode &&
						room.players.some((p) => p.sessionCode === providedSessionCode)
					) {
						const player = room.players.find(
							(p) => p.sessionCode === providedSessionCode,
						);
						if (player) {
							player.connected = true;
							sessionToWs.delete(currentSessionCode);
							wsData.sessionCode = providedSessionCode;
							sessionToWs.set(
								providedSessionCode,
								ws as unknown as ElysiaWebSocket,
							);
							wsData.roomCode = roomCode;
							subscribeToRoom(roomCode, providedSessionCode);

							ws.send(
								JSON.stringify({
									type: "reconnected",
									players: room.players,
									game: room.game,
									globalBoard: room.globalBoard,
									currentBoard: room.currentBoard,
									currentTurn: room.currentTurn,
									scores: room.scores,
									winner: room.winner,
									status: room.status,
									spectators: room.spectators,
								}),
							);

							broadcast(roomCode, {
								type: "playerReconnected",
								sessionCode: providedSessionCode,
							});
							return;
						}
					}

					if (asSpectator || room.players.length >= 2) {
						const spectator: Spectator = {
							sessionCode: currentSessionCode,
							name: playerName,
						};
						room.spectators.push(spectator);
						wsData.roomCode = roomCode;
						subscribeToRoom(roomCode, currentSessionCode);

						ws.send(
							JSON.stringify({
								type: "joinedAsSpectator",
								sessionCode: currentSessionCode,
								players: room.players,
								game: room.game,
								globalBoard: room.globalBoard,
								currentBoard: room.currentBoard,
								currentTurn: room.currentTurn,
								scores: room.scores,
								status: room.status,
								spectators: room.spectators,
								winner: room.winner,
							}),
						);

						broadcast(roomCode, {
							type: "spectatorJoined",
							name: playerName,
							spectators: room.spectators,
						});
						return;
					}

					room.players.push({
						sessionCode: currentSessionCode,
						name: playerName,
						connected: true,
					});
					room.scores[currentSessionCode] = { wins: 0, losses: 0, ties: 0 };
					wsData.roomCode = roomCode;
					subscribeToRoom(roomCode, currentSessionCode);

					ws.send(
						JSON.stringify({
							type: "sessionCode",
							sessionCode: currentSessionCode,
						}),
					);

					if (room.players.filter((p) => p.connected).length === 2) {
						if (room.currentTurn === null) {
							room.currentTurn = room.players[0].sessionCode;
						}
						room.status = "playing";

						broadcast(roomCode, {
							type: "gameStart",
							players: room.players,
							game: room.game,
							globalBoard: room.globalBoard,
							currentBoard: room.currentBoard,
							currentTurn: room.currentTurn,
							scores: room.scores,
							status: room.status,
							spectators: room.spectators,
						});
					} else {
						ws.send(
							JSON.stringify({
								type: "waitingForOpponent",
								sessionCode: currentSessionCode,
								status: room.status,
							}),
						);
					}
					break;
				}

				case "makeMove": {
					const { roomCode, boardIndex, cellIndex, sessionCode } = data;
					if (
						roomCode === undefined ||
						boardIndex === undefined ||
						cellIndex === undefined ||
						!sessionCode
					)
						return;

					const room = rooms.get(roomCode);
					if (
						!room ||
						room.players.filter((p) => p.connected).length !== 2 ||
						room.currentTurn === null
					) {
						ws.send(JSON.stringify({ type: "gameNotReady" }));
						return;
					}

					if (checkWinner(room.globalBoard)) {
						ws.send(JSON.stringify({ type: "gameAlreadyOver" }));
						return;
					}

					if (room.currentTurn !== sessionCode) {
						ws.send(JSON.stringify({ type: "notYourTurn" }));
						return;
					}

					const currentPlayerIndex = room.players.findIndex(
						(player) => player.sessionCode === sessionCode,
					);
					if (
						currentPlayerIndex === -1 ||
						room.game[boardIndex][cellIndex] !== null
					) {
						ws.send(JSON.stringify({ type: "invalidMove" }));
						return;
					}

					if (room.currentBoard !== null && room.currentBoard !== boardIndex) {
						ws.send(JSON.stringify({ type: "invalidMove" }));
						return;
					}

					room.game[boardIndex][cellIndex] =
						currentPlayerIndex === 0 ? "X" : "O";

					const localWinner = checkWinner(room.game[boardIndex]);
					if (localWinner) {
						room.globalBoard[boardIndex] =
							localWinner === "tie" ? null : localWinner;
					}

					const globalWinner = checkWinner(room.globalBoard);

					if (!globalWinner) {
						room.currentTurn =
							room.players[(currentPlayerIndex + 1) % 2].sessionCode;
					}

					room.currentBoard =
						room.game[cellIndex].every((cell) => cell !== null) ||
						room.globalBoard[cellIndex]
							? null
							: cellIndex;

					broadcast(roomCode, {
						type: "updateGame",
						game: room.game,
						globalBoard: room.globalBoard,
						currentBoard: room.currentBoard,
						currentTurn: room.currentTurn,
						scores: room.scores,
						spectators: room.spectators,
					});

					if (globalWinner) {
						updateScores(room, globalWinner, sessionCode);
						room.winner = sessionCode;

						broadcast(roomCode, {
							type: "gameOver",
							winner: sessionCode,
							scores: room.scores,
						});

						broadcast(roomCode, {
							type: "updateGame",
							game: room.game,
							globalBoard: room.globalBoard,
							currentBoard: room.currentBoard,
							currentTurn: room.currentTurn,
							scores: room.scores,
							winner: sessionCode,
							spectators: room.spectators,
						});
					}
					break;
				}

				case "requestGameReset": {
					const { roomCode } = data;
					if (!roomCode) return;

					const room = rooms.get(roomCode);
					if (room && room.winner !== null) {
						room.game = Array(9)
							.fill(null)
							.map(() => Array(9).fill(null));
						room.globalBoard = Array(9).fill(null);
						room.currentBoard = null;
						room.currentTurn = room.players[0].sessionCode;
						room.winner = null;
						const connectedPlayers = room.players.filter(
							(p) => p.connected,
						).length;
						room.status = connectedPlayers === 2 ? "playing" : "waiting";

						broadcast(roomCode, {
							type: "gameReset",
							game: room.game,
							globalBoard: room.globalBoard,
							currentBoard: room.currentBoard,
							currentTurn: room.currentTurn,
							scores: room.scores,
							winner: null,
							status: room.status,
							spectators: room.spectators,
						});
					}
					break;
				}

				case "reconnect": {
					const { roomCode, sessionCode } = data;
					if (!roomCode || !sessionCode) return;

					const room = rooms.get(roomCode);
					if (room) {
						const player = room.players.find(
							(p) => p.sessionCode === sessionCode,
						);
						if (player) {
							player.connected = true;
							sessionToWs.delete(currentSessionCode);
							wsData.sessionCode = sessionCode;
							sessionToWs.set(sessionCode, ws as unknown as ElysiaWebSocket);
							wsData.roomCode = roomCode;
							subscribeToRoom(roomCode, sessionCode);

							ws.send(
								JSON.stringify({
									type: "reconnected",
									players: room.players,
									game: room.game,
									globalBoard: room.globalBoard,
									currentBoard: room.currentBoard,
									currentTurn: room.currentTurn,
									scores: room.scores,
									winner: room.winner,
									status: room.status,
									spectators: room.spectators,
								}),
							);
						}
					}
					break;
				}
			}
		},
		close(ws) {
			const wsData = ws.data as unknown as WebSocketData;
			const sessionCode = wsData.sessionCode;
			const roomCode = wsData.roomCode;

			if (wsData.inQueue) {
				const index = queue.findIndex((p) => p.sessionCode === sessionCode);
				if (index !== -1) {
					queue.splice(index, 1);
					for (let i = 0; i < queue.length; i++) {
						const qWs = sessionToWs.get(queue[i].sessionCode);
						if (qWs) {
							qWs.send(
								JSON.stringify({ type: "queueUpdate", position: i + 1 }),
							);
						}
					}
				}
			}

			if (roomCode) {
				const room = rooms.get(roomCode);
				if (room) {
					const disconnectedPlayer = room.players.find(
						(p) => p.sessionCode === sessionCode,
					);
					const disconnectedSpectator = room.spectators.find(
						(s) => s.sessionCode === sessionCode,
					);

					if (disconnectedPlayer) {
						disconnectedPlayer.connected = false;
						broadcast(roomCode, {
							type: "playerDisconnected",
							sessionCode,
						});

						setTimeout(() => {
							if (!disconnectedPlayer.connected) {
								room.players = room.players.filter((p) => p.connected);
								unsubscribeFromRoom(roomCode, sessionCode);
								if (room.players.length === 0 && room.spectators.length === 0) {
									rooms.delete(roomCode);
									roomSubscribers.delete(roomCode);
									console.log("Room deleted:", roomCode);
								}
							}
						}, 60000);
					} else if (disconnectedSpectator) {
						room.spectators = room.spectators.filter(
							(s) => s.sessionCode !== sessionCode,
						);
						unsubscribeFromRoom(roomCode, sessionCode);
						broadcast(roomCode, {
							type: "spectatorLeft",
							sessionCode,
							spectators: room.spectators,
						});
					}
				}
			}

			sessionToWs.delete(sessionCode);
		},
	})
	.listen(process.env.PORT || 5000);

console.log(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
