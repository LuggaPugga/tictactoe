import type { Metadata } from "next";
import LocalMultiplayer from "./local-multiplayer";

export const metadata: Metadata = {
	title: "Local Multiplayer — Ultimate Tic Tac Toe",
	description:
		"Play Ultimate Tic Tac Toe with a friend on one device. Track wins, ties, and enjoy quick rematches.",
	openGraph: {
		title: "Local Multiplayer — Ultimate Tic Tac Toe",
		description:
			"Two-player Ultimate Tic Tac Toe on a single device with score tracking.",
		url: "/local-multiplayer",
		type: "website",
	},
};

export default function LocalMultiplayerPage() {
	return <LocalMultiplayer />;
}
