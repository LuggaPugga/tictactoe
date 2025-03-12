import { Socket } from "socket.io"

export interface Player {
  sessionCode: string
  name: string
  connected: boolean
}

export interface QueuePlayer {
  socket: Socket
  playerName: string
}

export interface Spectator {
  sessionCode: string
  name: string
}

export interface Score {
  wins: number
  losses: number
  ties: number
}

export interface GameRoom {
  players: Player[]
  spectators: Spectator[]
  game: (string | null)[][]
  globalBoard: (string | null)[]
  currentBoard: number | null
  currentTurn: string | null
  scores: Record<string, Score>
  sessionToSocket: Map<string, string>
  winner: string | null
  status: "waiting" | "playing"
}

export interface ServerToClientEvents {
  queueUpdate: (data: { position: number }) => void
  queueFull: () => void
  lobbyCreated: (data: { roomCode: string; sessionCode: string }) => void
  gameStart: (data: {
    players: Player[]
    game: (string | null)[][]
    globalBoard: (string | null)[]
    currentBoard: number | null
    currentTurn: string | null
    scores: Record<string, Score>
    status: string
    spectators: Spectator[]
  }) => void
  joinedQueue: (data: { position: number }) => void
  alreadyInQueueOrGame: () => void
  leftQueue: () => void
  roomNotFound: () => void
  reconnected: (data: {
    players: Player[]
    game: (string | null)[][]
    globalBoard: (string | null)[]
    currentBoard: number | null
    currentTurn: string | null
    scores: Record<string, Score>
    winner: string | null
    status: string
    spectators: Spectator[]
  }) => void
  playerReconnected: (sessionCode: string) => void
  joinedAsSpectator: (data: {
    sessionCode: string
    players: Player[]
    game: (string | null)[][]
    globalBoard: (string | null)[]
    currentBoard: number | null
    currentTurn: string | null
    scores: Record<string, Score>
    status: string
    spectators: Spectator[]
  }) => void
  spectatorJoined: (data: { name: string; spectators: Spectator[] }) => void
  sessionCode: (sessionCode: string) => void
  waitingForOpponent: (data: { sessionCode: string; status: string }) => void
  gameNotReady: () => void
  gameAlreadyOver: () => void
  notYourTurn: () => void
  invalidMove: () => void
  updateGame: (data: {
    game: (string | null)[][]
    globalBoard: (string | null)[]
    currentBoard: number | null
    currentTurn: string | null
    scores: Record<string, Score>
    winner?: string
    spectators: Spectator[]
  }) => void
  gameOver: (data: { winner: string; scores: Record<string, Score> }) => void
  gameReset: (data: {
    game: (string | null)[][]
    globalBoard: (string | null)[]
    currentBoard: number | null
    currentTurn: string | null
    scores: Record<string, Score>
    winner: null
    status: string
    spectators: Spectator[]
  }) => void
  playerDisconnected: (sessionCode: string) => void
  spectatorLeft: (data: { sessionCode: string; spectators: Spectator[] }) => void
}

export interface ClientToServerEvents {
  joinQueue: (data: { playerName: string }) => void
  leaveQueue: () => void
  joinRoom: (data: {
    roomCode: string
    playerName: string
    sessionCode?: string
    asSpectator?: boolean
  }) => void
  makeMove: (data: {
    roomCode: string
    boardIndex: number
    cellIndex: number
    sessionCode: string
  }) => void
  requestGameReset: (roomCode: string) => void
  reconnect: (data: { roomCode: string; sessionCode: string }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  inQueue: boolean
  roomCode: string | null
}

declare module "socket.io" {
  interface Socket {
    inQueue: boolean
    roomCode: string | null
  }
}
