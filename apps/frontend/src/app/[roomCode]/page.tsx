import type { Metadata } from "next";
import { use } from "react";
import GameComponent from "@/components/game/game";

export const generateMetadata = async ({
	params,
}: {
	params: Promise<{ roomCode: string }>;
}): Promise<Metadata> => {
	const { roomCode } = await params;

	return {
		openGraph: {
			images: [
				{
					url: `/api/og?roomCode=${roomCode}`,
					width: 1200,
					height: 630,
					alt: "TicTacToe Game Room",
				},
			],
		},
		twitter: {
			images: [`/api/og?roomCode=${roomCode}`],
		},
	};
};

export default function GamePage({
	params,
}: {
	params: Promise<{ roomCode: string }>;
}) {
	const { roomCode } = use(params);
	return <GameComponent roomCode={roomCode} />;
}
