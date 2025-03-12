"use client"

import type React from "react"
import { useEffect, useState } from "react"
import LocalBoard from "./local-board"
import { AnimatePresence, motion } from "framer-motion"
import type { Game } from "@/lib/types"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UltimateBoardProps {
  game: Game
  globalBoard: (string | null)[]
  currentBoard: number | null
  onCellClick: (boardIndex: number, cellIndex: number) => void
  inView?: boolean
}

const UltimateBoard: React.FC<UltimateBoardProps> = ({
  game,
  globalBoard,
  currentBoard,
  onCellClick,
  inView = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const boardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const fullscreenVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const renderBoard = () => (
    <div className="w-full max-w-[min(90vw,90vh)] aspect-square relative p-2 rounded-lg shadow-lg bg-background">
      <div className="w-full h-full flex flex-col">
        {[0, 1, 2].map((row) => (
          <>
            {row > 0 && (
              <div key={`hdiv-${row}`} className="h-2 bg-gray-400/50 dark:bg-gray-600/50" />
            )}
            <div key={`row-${row}`} className="flex-1 flex flex-row">
              {[0, 1, 2].map((col) => {
                const boardIndex = row * 3 + col
                return (
                  <>
                    {col > 0 && (
                      <div
                        key={`vdiv-${row}-${col}`}
                        className="w-2 bg-gray-400/50 dark:bg-gray-600/50"
                      />
                    )}
                    <div
                      key={`board-${boardIndex}`}
                      className={`relative flex-1 ${currentBoard === boardIndex ? "border-3 border-yellow-400 dark:border-yellow-500 bg-yellow-400/10 dark:bg-yellow-400/5" : "border-3 border-transparent"}`}
                    >
                      <LocalBoard
                        board={game[boardIndex] ?? []}
                        boardIndex={boardIndex}
                        onCellClick={onCellClick}
                        isActive={currentBoard === null || currentBoard === boardIndex}
                        winner={globalBoard[boardIndex] ?? null}
                      />
                    </div>
                  </>
                )
              })}
            </div>
          </>
        ))}
      </div>
    </div>
  )

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center space-y-4"
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={boardVariants}
    >
      {isMobile && !isFullscreen && (
        <div className="w-full max-w-[min(90vw,90vh)] flex justify-end mb-2">
          <Button variant="outline" size="sm" className="z-50" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      )}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="z-50 relative"
              variants={fullscreenVariants}
              initial="hidden"
              animate="visible"
            >
              {renderBoard()}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-[-40px] right-0 z-50"
                onClick={toggleFullscreen}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Fullscreen
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isFullscreen && renderBoard()}
    </motion.div>
  )
}

export default UltimateBoard
