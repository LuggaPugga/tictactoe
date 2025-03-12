"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { useRouter } from "next/navigation"
import { RoomNotFound } from "@/components/room-not-found"
import { WaitingRoom } from "@/components/waiting-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Scoreboard } from "@/components/game/scoreboard"
import { LogOut } from "lucide-react"
import UltimateBoard from "@/components/game/ultimate-board"
import type { Player, Score } from "@/lib/types"
import { WinnerAnimation } from "@/components/game/winning-animation"

export default function GameComponent({ roomCode }: { roomCode: string }) {
  const [game, setGame] = useState(Array(9).fill(Array(9).fill(null)))
  const [globalBoard, setGlobalBoard] = useState(Array(9).fill(null))
  const [currentBoard, setCurrentBoard] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [gameStatus, setGameStatus] = useState("waiting")
  const [winner, setWinner] = useState<string | null>(null)
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, Score>>({})
  const [roomExists, setRoomExists] = useState(true)
  const [playerName, setPlayerName] = useState("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isNameSet, setIsNameSet] = useState(false)
  const [roomStatus, setRoomStatus] = useState("waiting")
  const [isSpectator, setIsSpectator] = useState(false)
  const [spectators, setSpectators] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (winner) {
      setShowAnimation(true)
    }
  }, [winner])

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [showAnimation])

  useEffect(() => {
    const storedSessionCode = sessionStorage.getItem(`sessionCode_${roomCode}`)
    if (storedSessionCode) {
      setSessionCode(storedSessionCode)
    }

    const storedPlayerName =
      localStorage.getItem("name") || sessionStorage.getItem(`playerName_${roomCode}`)
    if (storedPlayerName) {
      setPlayerName(storedPlayerName)
      setIsNameSet(true)
    }
  }, [roomCode])

  useEffect(() => {
    if (!isNameSet) return

    setIsLoading(true)
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL)
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("Connected to server")
      const storedSessionCode = sessionStorage.getItem(`sessionCode_${roomCode}`)
      newSocket.emit("joinRoom", { roomCode, playerName, sessionCode: storedSessionCode })
    })

    newSocket.on("waitingForOpponent", ({ sessionCode: newSessionCode, status }) => {
      setSessionCode(newSessionCode)
      sessionStorage.setItem(`sessionCode_${roomCode}`, newSessionCode)
      setRoomStatus(status)
      setIsLoading(false)
    })

    newSocket.on("sessionCode", (newSessionCode) => {
      setSessionCode(newSessionCode)
      sessionStorage.setItem(`sessionCode_${roomCode}`, newSessionCode)
    })

    newSocket.on(
      "gameStart",
      ({ players, game, globalBoard, currentBoard, currentTurn, scores, status }) => {
        setPlayers(players.map((player: Player) => ({ ...player, connected: true })))
        setGame(game)
        setGlobalBoard(globalBoard)
        setCurrentBoard(currentBoard)
        setCurrentTurn(currentTurn)
        setGameStatus("playing")
        setScores(scores)
        setRoomStatus(status)
        setIsLoading(false)
      },
    )

    newSocket.on(
      "updateGame",
      ({ game, globalBoard, currentBoard, currentTurn, scores, winner }) => {
        setGame(game)
        setGlobalBoard(globalBoard)
        setCurrentBoard(currentBoard)
        setCurrentTurn(currentTurn)
        setScores(scores)
        if (winner) {
          setWinner(winner)
          setGameStatus("over")
        }
      },
    )

    newSocket.on("playerDisconnected", (disconnectedSessionCode) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.sessionCode === disconnectedSessionCode ? { ...player, connected: false } : player,
        ),
      )
    })

    newSocket.on("playerReconnected", (reconnectedSessionCode) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.sessionCode === reconnectedSessionCode ? { ...player, connected: true } : player,
        ),
      )
    })

    newSocket.on("roomFull", () => {
      if (!sessionStorage.getItem(`sessionCode_${roomCode}`)) {
        alert("Room is full. You can join as a spectator.")
        newSocket.emit("joinRoom", { roomCode, playerName, asSpectator: true })
      } else {
        console.log("Attempting to reconnect to the game...")
      }
    })

    newSocket.on(
      "reconnected",
      ({
        game,
        globalBoard,
        currentBoard,
        currentTurn,
        players,
        scores,
        winner,
        status,
        spectators,
      }) => {
        setGame(game)
        setGlobalBoard(globalBoard)
        setCurrentBoard(currentBoard)
        setCurrentTurn(currentTurn)
        setPlayers(players.map((player: Player) => ({ ...player, connected: true })))
        setScores(scores)
        setWinner(winner)
        setGameStatus(winner ? "over" : "playing")
        setRoomStatus(status)
        setSpectators(spectators)
        setIsLoading(false)
      },
    )

    newSocket.on("roomNotFound", () => {
      setRoomExists(false)
      setIsLoading(false)
    })

    newSocket.on(
      "gameReset",
      ({ game, globalBoard, currentBoard, currentTurn, scores, winner }) => {
        setGame(game)
        setGlobalBoard(globalBoard)
        setCurrentBoard(currentBoard)
        setCurrentTurn(currentTurn)
        setGameStatus("playing")
        setWinner(winner)
        setScores(scores)
      },
    )

    newSocket.on("joinedAsSpectator", (data) => {
      setIsSpectator(true)
      setGame(data.game)
      setGlobalBoard(data.globalBoard)
      setCurrentBoard(data.currentBoard)
      setCurrentTurn(data.currentTurn)
      setPlayers(data.players)
      setScores(data.scores)
      setRoomStatus(data.status)
      setSpectators(Array.isArray(data.spectators) ? data.spectators : [])
      setGameStatus(data.winner ? "over" : "playing")
      setIsLoading(false)
    })

    newSocket.on("spectatorJoined", ({ spectators: newSpectators }) => {
      setSpectators(Array.isArray(newSpectators) ? newSpectators : [])
    })

    newSocket.on("spectatorLeft", ({ spectators: newSpectators }) => {
      setSpectators(Array.isArray(newSpectators) ? newSpectators : [])
    })

    return () => {
      newSocket.disconnect()
    }
  }, [roomCode, playerName, isNameSet])

  useEffect(() => {
    if (isSpectator && gameStatus === "waiting") {
      setGameStatus("playing")
    }
  }, [isSpectator, gameStatus])

  const handleCellClick = useCallback(
    (boardIndex: number, cellIndex: number) => {
      if (
        socket &&
        game[boardIndex][cellIndex] === null &&
        currentTurn === sessionCode &&
        gameStatus !== "over" &&
        !isSpectator
      ) {
        socket.emit("makeMove", { roomCode, boardIndex, cellIndex, sessionCode })
      }
    },
    [socket, game, currentTurn, sessionCode, gameStatus, roomCode, isSpectator],
  )

  const handleLeaveGame = useCallback(() => {
    if (socket) {
      socket.disconnect()
    }
    router.push("/")
  }, [socket, router])

  const handleRequestReset = useCallback(() => {
    if (socket && gameStatus === "over" && !isSpectator) {
      socket.emit("requestGameReset", roomCode)
    }
  }, [socket, roomCode, gameStatus, isSpectator])

  const handleNameSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (playerName.trim()) {
        localStorage.setItem("name", playerName)
        sessionStorage.setItem(`playerName_${roomCode}`, playerName)
        setIsNameSet(true)
      }
    },
    [playerName, roomCode],
  )

  if (!isNameSet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10 border border-border/40"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#c1644d] dark:text-[#e07a5f]">Join Game</h1>
            <p className="text-muted-foreground">Enter your name to join the game</p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="playerName" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter name"
                className="w-full rounded-md border-border/60 bg-input px-4 py-2 text-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#e07a5f]/50"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#c1644d] hover:bg-[#b15a44] dark:bg-[#e07a5f] dark:hover:bg-[#d0694e] text-white font-semibold py-3 px-4 rounded-md transition duration-200"
            >
              Set Name
            </Button>
          </form>
        </motion.div>
      </div>
    )
  }

  if (!roomExists) {
    return <RoomNotFound />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl shadow-xl p-8 max-w-md w-full space-y-8 relative z-10"
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-t-2 border-b-2 border-[#c1644d] rounded-full animate-spin"></div>
            <p className="text-lg">Connecting to room...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (roomStatus === "waiting") {
    return <WaitingRoom gameCode={roomCode} onCancel={handleLeaveGame} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <h1>{roomStatus}</h1>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
      </div>
      <div className="absolute top-4 right-4">
        <Button
          onClick={handleLeaveGame}
          variant="ghost"
          size="icon"
          className="text-white hover:text-red-500 transition-colors hover:bg-transparent"
          data-umami-event="leave-game"
        >
          <LogOut className="size-6" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl relative z-10"
      >
        <h1 className="text-4xl font-bold mb-8 text-center">Ultimate Tic-Tac-Toe</h1>
        {isSpectator && (
          <p className="text-center text-yellow-400 mb-4">You are spectating this game</p>
        )}
        {(gameStatus === "playing" || gameStatus === "over" || isSpectator) && (
          <div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
            <div className="w-full xl:w-3/4 flex justify-center order-2 xl:order-1">
              <div className="w-full max-w-[80vh] aspect-square">
                <UltimateBoard
                  game={game}
                  globalBoard={globalBoard}
                  currentBoard={currentBoard}
                  onCellClick={handleCellClick}
                />
              </div>
            </div>
            <div className="w-full lg:w-1/4 lg:fixed lg:right-4 lg:top-1/2 lg:transform lg:-translate-y-1/2 order-1 lg:order-2">
              <Scoreboard
                players={players}
                scores={scores}
                currentTurn={currentTurn}
                sessionCode={sessionCode}
                ended={!!winner}
                onPlayAgain={handleRequestReset}
                spectatorCount={spectators.length | 0}
                roomCode={roomCode}
              />
            </div>
          </div>
        )}
        {gameStatus === "interrupted" && (
          <p className="text-red-500 mb-4 text-center">
            Your opponent has disconnected. You can leave the game or wait for a new opponent.
          </p>
        )}
        {gameStatus === "interrupted" && !isSpectator && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleRequestReset}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Play Again
            </Button>
          </div>
        )}
      </motion.div>
      <WinnerAnimation
        isVisible={showAnimation}
        winner={players.find((p) => p.sessionCode === winner)?.name || ""}
      />
    </div>
  )
}
