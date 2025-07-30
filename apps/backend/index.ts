import { Server } from "socket.io";
import cors from "cors";
import express from "express";
import http from "http";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData,
	GameRoom,
	QueuePlayer,
} from "./types";

const app = express();
const server = http.createServer(app);

const corsOptions = {
	origin: "*",
	methods: ["GET", "POST", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: true,
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const io = new Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	},
});

const rooms = new Map<string, GameRoom>();
const queue: QueuePlayer[] = [];
const MAX_QUEUE_SIZE = 100;

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
		sessionToSocket: new Map(),
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
		room.players.forEach((player) => room.scores[player.sessionCode].ties++);
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

function updateQueuePositions(): void {
	queue.forEach((player, index) => {
		player.socket.emit("queueUpdate", { position: index + 1 });
	});
}

function createLobby(player1: QueuePlayer, player2: QueuePlayer): void {
	const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
	const room = createRoom();
	rooms.set(roomCode, room);
	[player1, player2].forEach((player) => {
		const sessionCode = Math.random().toString(36).substring(2, 15);
		room.players.push({
			sessionCode,
			name: player.playerName,
			connected: true,
		});
		room.scores[sessionCode] = { wins: 0, losses: 0, ties: 0 };
		room.sessionToSocket.set(sessionCode, player.socket.id);

		player.socket.join(roomCode);
		player.socket.emit("lobbyCreated", { roomCode, sessionCode });
	});

	room.currentTurn = room.players[0].sessionCode;
	room.status = "playing";

	io.to(roomCode).emit("gameStart", {
		players: room.players,
		game: room.game,
		globalBoard: room.globalBoard,
		currentBoard: room.currentBoard,
		currentTurn: room.currentTurn,
		scores: room.scores,
		status: room.status,
		spectators: room.spectators,
	});
}

io.on("connection", (socket) => {
	socket.inQueue = false;
	socket.roomCode = null;

	socket.on("joinQueue", ({ playerName }) => {
		if (!socket.inQueue && !socket.roomCode) {
			socket.inQueue = true;
			if (queue.length >= MAX_QUEUE_SIZE) {
				socket.emit("queueFull");
				return;
			}

			const player: QueuePlayer = { socket, playerName };
			queue.push(player);
			socket.emit("joinedQueue", { position: queue.length });

			if (queue.length >= 2) {
				const player1 = queue.shift();
				const player2 = queue.shift();
				if (player1 && player2) {
					createLobby(player1, player2);
				}
			}
		} else {
			socket.emit("alreadyInQueueOrGame");
		}
	});

	socket.on("leaveQueue", () => {
		if (socket.inQueue) {
			const index = queue.findIndex((player) => player.socket === socket);
			if (index !== -1) {
				queue.splice(index, 1);
				socket.emit("leftQueue");
				updateQueuePositions();
			}
			socket.inQueue = false;
		}
	});

	socket.on(
		"joinRoom",
		({ roomCode, playerName, sessionCode, asSpectator }) => {
			if (socket.inQueue) {
				const index = queue.findIndex((player) => player.socket === socket);
				if (index !== -1) {
					queue.splice(index, 1);
					socket.emit("leftQueue");
					updateQueuePositions();
				}
				socket.inQueue = false;
			}
			const room = rooms.get(roomCode);
			if (!room) {
				socket.emit("roomNotFound");
				return;
			}

			if (
				sessionCode &&
				room.players.some((p) => p.sessionCode === sessionCode)
			) {
				const player = room.players.find((p) => p.sessionCode === sessionCode);
				if (player) {
					player.connected = true;
					room.sessionToSocket.set(sessionCode, socket.id);
					socket.join(roomCode);
					socket.roomCode = roomCode;
					socket.emit("reconnected", {
						players: room.players,
						game: room.game,
						globalBoard: room.globalBoard,
						currentBoard: room.currentBoard,
						currentTurn: room.currentTurn,
						scores: room.scores,
						winner: room.winner,
						status: room.status,
						spectators: room.spectators,
					});
					socket.to(roomCode).emit("playerReconnected", sessionCode);
					return;
				}
			}

			const newSessionCode =
				sessionCode || Math.random().toString(36).substring(2, 15);
			let player = room.players.find((p) => p.sessionCode === newSessionCode);

			if (player) {
				player.name = playerName;
				player.connected = true;
			} else if (asSpectator || room.players.length >= 2) {
				const spectator = { sessionCode: newSessionCode, name: playerName };
				room.spectators.push(spectator);
				room.sessionToSocket.set(newSessionCode, socket.id);
				socket.join(roomCode);
				socket.roomCode = roomCode;
				socket.emit("joinedAsSpectator", {
					sessionCode: newSessionCode,
					players: room.players,
					game: room.game,
					globalBoard: room.globalBoard,
					currentBoard: room.currentBoard,
					currentTurn: room.currentTurn,
					scores: room.scores,
					status: room.status,
					spectators: room.spectators,
				});
				io.to(roomCode).emit("spectatorJoined", {
					name: playerName,
					spectators: room.spectators,
				});
				return;
			} else {
				player = {
					sessionCode: newSessionCode,
					name: playerName,
					connected: true,
				};
				room.players.push(player);
				room.scores[newSessionCode] = { wins: 0, losses: 0, ties: 0 };
			}

			room.sessionToSocket.set(newSessionCode, socket.id);
			socket.join(roomCode);
			socket.roomCode = roomCode;
			socket.emit("sessionCode", newSessionCode);

			if (room.players.filter((p) => p.connected).length === 2) {
				if (room.currentTurn === null) {
					room.currentTurn = room.players[0].sessionCode;
				}
				room.status = "playing";
				io.to(roomCode).emit("gameStart", {
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
				socket.emit("waitingForOpponent", {
					sessionCode: player.sessionCode,
					status: room.status,
				});
			}
		},
	);

	socket.on("makeMove", ({ roomCode, boardIndex, cellIndex, sessionCode }) => {
		const room = rooms.get(roomCode);
		if (
			!room ||
			room.players.filter((p) => p.connected).length !== 2 ||
			room.currentTurn === null
		) {
			socket.emit("gameNotReady");
			return;
		}

		if (checkWinner(room.globalBoard)) {
			socket.emit("gameAlreadyOver");
			return;
		}

		if (room.currentTurn !== sessionCode) {
			socket.emit("notYourTurn");
			return;
		}

		const currentPlayerIndex = room.players.findIndex(
			(player) => player.sessionCode === sessionCode,
		);
		if (
			currentPlayerIndex === -1 ||
			room.game[boardIndex][cellIndex] !== null
		) {
			socket.emit("invalidMove");
			return;
		}

		if (room.currentBoard !== null && room.currentBoard !== boardIndex) {
			socket.emit("invalidMove");
			return;
		}

		room.game[boardIndex][cellIndex] = currentPlayerIndex === 0 ? "X" : "O";

		const localWinner = checkWinner(room.game[boardIndex]);
		if (localWinner) {
			room.globalBoard[boardIndex] = localWinner === "tie" ? null : localWinner;
		}

		const globalWinner = checkWinner(room.globalBoard);

		if (!globalWinner) {
			room.currentTurn = room.players[(currentPlayerIndex + 1) % 2].sessionCode;
		}
		room.currentBoard =
			room.game[cellIndex].every((cell) => cell !== null) ||
			room.globalBoard[cellIndex]
				? null
				: cellIndex;

		io.to(roomCode).emit("updateGame", {
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
			io.to(roomCode).emit("gameOver", {
				winner: sessionCode,
				scores: room.scores,
			});
			io.to(roomCode).emit("updateGame", {
				game: room.game,
				globalBoard: room.globalBoard,
				currentBoard: room.currentBoard,
				currentTurn: room.currentTurn,
				scores: room.scores,
				winner: sessionCode,
				spectators: room.spectators,
			});
		}
	});

	socket.on("requestGameReset", (roomCode) => {
		const room = rooms.get(roomCode);
		if (room && room.winner) {
			room.game = Array(9)
				.fill(null)
				.map(() => Array(9).fill(null));
			room.globalBoard = Array(9).fill(null);
			room.currentBoard = null;
			room.currentTurn = room.players[0].sessionCode;
			room.winner = null;
			room.status = "waiting";
			io.to(roomCode).emit("gameReset", {
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
	});

	socket.on("disconnect", () => {
		if (socket.inQueue) {
			const index = queue.findIndex((player) => player.socket === socket);
			if (index !== -1) {
				queue.splice(index, 1);
				updateQueuePositions();
			}
		}
		for (const [roomCode, room] of rooms.entries()) {
			const disconnectedSessionCode = Array.from(
				room.sessionToSocket.entries(),
			).find(([, socketId]) => socketId === socket.id)?.[0];

			if (disconnectedSessionCode) {
				const disconnectedPlayer = room.players.find(
					(player) => player.sessionCode === disconnectedSessionCode,
				);
				const disconnectedSpectator = room.spectators.find(
					(spectator) => spectator.sessionCode === disconnectedSessionCode,
				);

				if (disconnectedPlayer) {
					disconnectedPlayer.connected = false;
					io.to(roomCode).emit("playerDisconnected", disconnectedSessionCode);

					setTimeout(() => {
						if (!disconnectedPlayer.connected) {
							room.players = room.players.filter((p) => p.connected);
							room.sessionToSocket.delete(disconnectedSessionCode);
							if (room.players.length === 0 && room.spectators.length === 0) {
								rooms.delete(roomCode);
								console.log("Room deleted:", roomCode);
							}
						}
					}, 60000);
				} else if (disconnectedSpectator) {
					room.spectators = room.spectators.filter(
						(s) => s.sessionCode !== disconnectedSessionCode,
					);
					room.sessionToSocket.delete(disconnectedSessionCode);
					io.to(roomCode).emit("spectatorLeft", {
						sessionCode: disconnectedSessionCode,
						spectators: room.spectators,
					});
				}
				break;
			}
		}
	});

	socket.on("reconnect", ({ roomCode, sessionCode }) => {
		const room = rooms.get(roomCode);
		if (room) {
			const player = room.players.find((p) => p.sessionCode === sessionCode);
			if (player) {
				player.connected = true;
				room.sessionToSocket.set(sessionCode, socket.id);
				socket.join(roomCode);
				socket.emit("reconnected", {
					players: room.players,
					game: room.game,
					globalBoard: room.globalBoard,
					currentBoard: room.currentBoard,
					currentTurn: room.currentTurn,
					scores: room.scores,
					winner: room.winner,
					status: room.status,
					spectators: room.spectators,
				});
			}
		}
	});
});

app.post("/api/create-room", async (_req, res) => {
	try {
		const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
		rooms.set(roomCode, createRoom());
		res.json({ roomCode });
	} catch (error) {
		console.error("Error creating room:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

const PORT = process.env["PORT"] || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
