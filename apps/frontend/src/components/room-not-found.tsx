"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Home, Loader2, Wifi } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { createRoom } from "@/utils/create-room"

export function RoomNotFound() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateRoom = async () => {
    setIsLoading(true)
    try {
      const roomCode = await createRoom()
      if (roomCode) {
        router.push(`/${roomCode}`)
      } else {
        alert("Failed to create room. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative text-foreground">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      </div>

      <div className="rounded-2xl max-w-md w-full space-y-8 relative z-10">
        <h2 className="text-3xl font-bold text-center text-primary">Room Not Found</h2>

        <Card className="border shadow-lg backdrop-blur-sm">
          <CardContent className="space-y-4 pt-4">
            <p className="text-lg mb-2 font-medium">Oops!</p>
            <p className="text-base text-muted-foreground mb-4">
              The room you&apos;re looking for doesn&apos;t exist or has expired.
            </p>

            <Button onClick={() => router.push("/")} className="w-full h-12 text-base">
              <Home className="mr-2 size-5" />
              Return to Home
            </Button>

            <Button
              onClick={handleCreateRoom}
              className="w-full h-12 text-base"
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <Wifi className="mr-2 size-5" />
                  Create New Lobby
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <motion.p
          className="text-center text-sm text-muted-foreground mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Need help? Try refreshing or creating a new room.
        </motion.p>
      </div>
    </div>
  )
}
