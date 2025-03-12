import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ContinueGameDialogProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  onNewGame: () => void
}

export const ContinueGameDialog: React.FC<ContinueGameDialogProps> = ({
  isOpen,
  onClose,
  onContinue,
  onNewGame,
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Continue Previous Game?</DialogTitle>
        <DialogDescription>
          A previous game was found. Would you like to continue it or start a new game?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={onNewGame} variant="outline">
          New Game
        </Button>
        <Button
          onClick={onContinue}
          className="bg-[#c1644d] hover:bg-[#b15a44] dark:bg-[#e07a5f] dark:hover:bg-[#d0694e]"
        >
          Continue
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
