"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WaitingRoomProps {
	gameCode: string;
	onCancel: () => void;
}

export function WaitingRoom({ gameCode, onCancel }: WaitingRoomProps) {
	const [isCopied, setIsCopied] = useState(false);

	const handleCopyGameCode = () => {
		navigator.clipboard.writeText(gameCode).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		});
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-grid-slate-300/[0.1] dark:bg-grid-slate-700/[0.1] bg-[size:40px_40px]" />
				<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
			</div>

			<div className="rounded-2xl max-w-md w-full space-y-8 relative z-10">
				<h2 className="text-3xl font-bold text-center text-primary">
					Waiting for opponent
					<span className="dots-animation"></span>
				</h2>

				<Card className="border shadow-lg backdrop-blur-sm">
					<CardContent className="space-y-4 pt-4">
						<p className="text-lg mb-2 font-medium">Game Code:</p>
						<div className="flex items-center justify-between bg-background rounded-lg p-3 mb-4 border-2 border-primary/30 shadow-sm hover:border-primary/50 transition-colors">
							<p className="text-3xl font-mono font-bold text-primary">
								{gameCode}
							</p>
							<Button
								onClick={handleCopyGameCode}
								variant="ghost"
								size="icon"
								className="hover:bg-[#c1644d]/10 dark:hover:bg-[#e07a5f]/10"
							>
								<AnimatePresence mode="wait" initial={false}>
									{isCopied ? (
										<motion.div
											key="check"
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											exit={{ scale: 0 }}
											transition={{ duration: 0.2 }}
										>
											<CheckCircle2 className="h-5 w-5 text-green-500" />
										</motion.div>
									) : (
										<motion.div
											key="copy"
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											exit={{ scale: 0 }}
											transition={{ duration: 0.2 }}
										>
											<Copy className="h-5 w-5 text-muted-foreground" />
										</motion.div>
									)}
								</AnimatePresence>
							</Button>
						</div>
						<p className="text-base text-muted-foreground mb-4">
							Share this code with your opponent to start the game
						</p>

						<Button
							onClick={onCancel}
							variant="outline"
							className="w-full h-12 text-base"
						>
							Cancel Game
						</Button>
					</CardContent>
				</Card>

				<motion.p
					className="text-center text-sm text-muted-foreground mt-2"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8 }}
				>
					Your opponent will join soon. Get ready to play!
				</motion.p>
			</div>
		</div>
	);
}
