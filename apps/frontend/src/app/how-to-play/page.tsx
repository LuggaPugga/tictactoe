import type { Metadata } from "next";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
	title: "How to Play Ultimate Tic Tac Toe — Rules, Strategy & Tips",
	description:
		"Learn the rules of Ultimate Tic Tac Toe with clear step-by-step instructions, board mechanics, strategy tips, and FAQs.",
	keywords: [
		"how to play ultimate tic tac toe",
		"ultimate tic tac toe rules",
		"ultimate tic tac toe strategy",
		"what is ultimate tic tac toe",
		"ultimate tic tac toe board",
	],
	alternates: { canonical: "/how-to-play" },
	openGraph: {
		title: "How to Play Ultimate Tic Tac Toe — Rules, Strategy & Tips",
		description:
			"Step-by-step guide to Ultimate Tic Tac Toe: rules, turns, global/local wins, and strategies.",
		type: "article",
		url: "/how-to-play",
	},
};

const steps = [
	{
		title: "Understand the Board",
		description:
			"Ultimate Tic Tac Toe is a 3×3 grid of 3×3 boards. Win local boards to claim squares on the global board.",
	},
	{
		title: "First Move",
		description:
			"Player X starts on any cell in any local board — there is no restriction for the first move.",
	},
	{
		title: "Send Your Opponent",
		description:
			"Your move determines where your opponent must play next: the cell index you choose sends them to that corresponding local board.",
	},
	{
		title: "When a Board Is Full or Won",
		description:
			"If the directed local board is already won or full, your opponent may play in any open board.",
	},
	{
		title: "Win Condition",
		description:
			"Win three local boards in a row (row, column, or diagonal) on the global board to win the game.",
	},
];

const faqs = [
	{
		q: "What happens if a local board ties?",
		a: "A tied local board does not award the global square to either player; it remains neutral.",
	},
	{
		q: "Can I play anywhere on the first turn?",
		a: "Yes. The first move can be in any cell of any local board.",
	},
	{
		q: "How do I know where to play next?",
		a: "Look at the cell index of your opponent’s last move; that index selects the local board you must play in.",
	},
	{
		q: "How long are games typically?",
		a: "Games usually take 5–15 minutes depending on player skill and whether boards fill up or are won quickly.",
	},
];

export default function HowToPlayPage() {
	const howToJsonLd = {
		"@context": "https://schema.org",
		"@type": "HowTo",
		name: "How to Play Ultimate Tic Tac Toe",
		description:
			"Step-by-step instructions explaining boards, move rules, redirects, and how to win the global board.",
		step: steps.map((s, i) => ({
			"@type": "HowToStep",
			position: i + 1,
			name: s.title,
			description: s.description,
		})),
	};

	const faqJsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((f) => ({
			"@type": "Question",
			name: f.q,
			acceptedAnswer: { "@type": "Answer", text: f.a },
		})),
	};

	return (
		<div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
			<Card className="border-none shadow-none">
				<CardHeader>
					<CardTitle className="text-4xl">
						How to Play Ultimate Tic Tac Toe
					</CardTitle>
					<CardDescription>
						Master the 9×9 strategy game. Learn the rules, flow, and winning
						tactics.
					</CardDescription>
				</CardHeader>
				<CardContent className="prose dark:prose-invert">
					<h3 className="text-2xl font-semibold">Quick overview</h3>
					<ul className="list-disc pl-6">
						<li>There are nine 3×3 boards arranged in a 3×3 grid.</li>
						<li>Win a local board to claim that square on the global board.</li>
						<li>Your move sends your opponent to the matching local board.</li>
						<li>
							If that board is full or already won, they can play anywhere.
						</li>
					</ul>
					<Separator className="my-6" />

					<div className="flex items-start gap-6">
						<div className="flex-1">
							<ol>
								{steps.map((s) => (
									<li key={s.title} className="mb-4">
										<h3 className="text-xl font-semibold">{s.title}</h3>
										<p className="text-muted-foreground">{s.description}</p>
									</li>
								))}
							</ol>
						</div>
					</div>

					<Separator className="my-6" />
					<h3 className="text-2xl font-semibold">Turn walkthrough</h3>
					<ol className="list-decimal pl-6">
						<li>X plays in the center of the top-left board (index 4).</li>
						<li>O must now play somewhere in the center board.</li>
						<li>O chooses the bottom-right cell (index 8) of that board.</li>
						<li>X must now play in the bottom-right local board, and so on.</li>
					</ol>

					<Separator className="my-6" />
					<h3 className="text-2xl font-semibold">Strategy Tips</h3>
					<ul className="list-disc pl-6">
						<li>
							Prioritize sending your opponent to bad boards while keeping
							multiple options for yourself.
						</li>
						<li>
							Control the center local boards; they redirect to many valuable
							spots.
						</li>
						<li>
							When forced, defend the opponent’s imminent global three-in-a-row
							first.
						</li>
						<li>
							Consider future redirects before claiming a local win that sends
							them to a dangerous board.
						</li>
					</ul>

					<Separator className="my-6" />
					<h3 className="text-2xl font-semibold">Common mistakes</h3>
					<ul className="list-disc pl-6">
						<li>
							Ignoring the redirect: every move dictates your opponent’s next
							board.
						</li>
						<li>
							Winning a local board that sends the opponent to an easy global
							win.
						</li>
						<li>
							Overlooking tied local boards; they don’t claim the global square.
						</li>
					</ul>

					<Separator className="my-6" />
					<h3 className="text-2xl font-semibold">FAQ</h3>
					<dl>
						{faqs.map((f) => (
							<div key={f.q} className="mb-4">
								<dt className="font-medium">{f.q}</dt>
								<dd className="text-muted-foreground">{f.a}</dd>
							</div>
						))}
					</dl>

					<div className="mt-8 flex gap-3">
						<Button asChild>
							<a href="/">Play Online</a>
						</Button>
						<Button asChild variant="outline">
							<a href="/local-multiplayer">Play Local</a>
						</Button>
					</div>
				</CardContent>
			</Card>

			<Script type="application/ld+json" strategy="afterInteractive">
				{JSON.stringify(howToJsonLd)}
			</Script>
			<Script type="application/ld+json" strategy="afterInteractive">
				{JSON.stringify(faqJsonLd)}
			</Script>
		</div>
	);
}
