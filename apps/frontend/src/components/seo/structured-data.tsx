"use client";

import Script from "next/script";

export default function StructuredData() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "TicTacToe",
		applicationCategory: "GameApplication",
		operatingSystem: "Web",
		description:
			"A modern TicTacToe game with online multiplayer, local play, and more",
	};

	return (
		<Script
			id="structured-data"
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}
