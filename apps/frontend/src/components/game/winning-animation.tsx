"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Trophy } from "lucide-react"

interface WinnerAnimationProps {
  isVisible: boolean
  winner: string
  onAnimationComplete?: () => void
}

export function WinnerAnimation({ isVisible, winner, onAnimationComplete }: WinnerAnimationProps) {
  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center backdrop-blur-md z-50 bg-black/50"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
              className="inline-block mb-4"
            >
              <Trophy className="w-24 h-24 text-yellow-400" />
            </motion.div>
            <motion.h1
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4"
            >
              {winner} has won!
            </motion.h1>
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-200"
            >
              Congratulations on your victory!
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
