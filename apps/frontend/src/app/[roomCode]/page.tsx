import GameComponent from "@/components/game/game"

export default async function GamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params
  return <GameComponent roomCode={roomCode} />
}
