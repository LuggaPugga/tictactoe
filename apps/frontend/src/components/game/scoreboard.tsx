"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Circle, Eye, Hash, Minus, Trophy, X } from "lucide-react"
import type { Player, Score } from "@/lib/types"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface ScoreboardProps {
  players: Player[]
  localGame?: boolean
  scores: Record<string, Score>
  currentTurn: string | null
  sessionCode?: string | null
  ended?: boolean
  onPlayAgain?: () => void
  spectatorCount?: number
  roomCode?: string
}

export function Scoreboard({
  players,
  localGame = false,
  scores,
  currentTurn,
  sessionCode,
  onPlayAgain,
  ended = false,
  spectatorCount,
  roomCode,
}: ScoreboardProps) {
  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => {
      if (localGame) return 0
      if (a.sessionCode === sessionCode) return -1
      if (b.sessionCode === sessionCode) return 1
      return 0
    })
  }, [players, sessionCode, localGame])

  return (
    <Card className="w-full max-w-lg mx-auto bg-background border-0 shadow-none">
      <CardContent className="p-6 space-y-6">
        {roomCode && (
          <Card className="rounded-none border-x-0 border-t-0">
            <CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <span className="text-sm font-medium">{spectatorCount}</span>
                  <span className="text-xs text-muted-foreground ml-1">Spectators</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <span className="text-sm font-medium">{roomCode}</span>
                  <span className="text-xs text-muted-foreground ml-1">Room</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="space-y-4">
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.sessionCode || player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={`overflow-hidden ${
                  player.sessionCode === currentTurn || player.id === currentTurn
                    ? "ring-0 ring-primary"
                    : ""
                }`}
              >
                <div
                  className={`p-4 ${
                    player.sessionCode === currentTurn || player.id === currentTurn
                      ? "bg-primary text-white"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          player.sessionCode === currentTurn || player.id === currentTurn
                            ? "bg-white text-primary"
                            : "bg-primary text-white"
                        }`}
                      >
                        {player.sessionCode === sessionCode || player.id === "O" ? (
                          <Circle className="size-6" />
                        ) : (
                          <X className="size-6" />
                        )}
                      </div>
                      <div>
                        <span className="text-lg font-semibold">
                          {player.name}
                          {!localGame && player.sessionCode === sessionCode && " (You)"}
                        </span>
                        {(player.sessionCode === currentTurn || player.id === currentTurn) &&
                          !ended && <div className="text-sm font-medium">Current Turn</div>}
                      </div>
                    </div>
                    {!localGame && !player.connected && (
                      <div className="text-sm font-medium text-red-500">(Disconnected)</div>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-background">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Trophy className="size-5 text-yellow-400" />
                      <span className="font-medium">
                        {scores[player.sessionCode || player.id]?.wins || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <X className="size-5 text-red-400" />
                      <span className="font-medium">
                        {scores[player.sessionCode || player.id]?.losses || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Minus className="size-5 text-blue-400" />
                      <span className="font-medium">
                        {scores[player.sessionCode || player.id]?.ties || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {ended && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={onPlayAgain}
                className="w-full h-12 text-base font-semibold transition duration-200"
              >
                Play Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
