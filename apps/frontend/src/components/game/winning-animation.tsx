import { Trophy } from "lucide-solid";
import { Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";

interface WinnerAnimationProps {
	isVisible: boolean;
	winner: string;
	onAnimationComplete?: () => void;
}

export function WinnerAnimation(props: WinnerAnimationProps) {
	return (
		<Presence>
			<Show when={props.isVisible}>
				<Motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
					class="fixed inset-0 flex items-center justify-center backdrop-blur-md z-50 bg-black/50"
				>
					<div class="text-center">
						<Motion.div
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ duration: 0.6, easing: [0.34, 1.56, 0.64, 1] }}
							class="inline-block mb-4"
						>
							<Trophy class="w-24 h-24 text-yellow-400" />
						</Motion.div>
						<Motion.h1
							initial={{ y: -50, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								duration: 0.6,
								delay: 0.2,
								easing: [0.34, 1.56, 0.64, 1],
							}}
							class="text-4xl md:text-6xl font-bold text-white mb-4"
						>
							{props.winner} has won!
						</Motion.h1>
						<Motion.p
							initial={{ y: 50, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								duration: 0.6,
								delay: 0.4,
								easing: [0.34, 1.56, 0.64, 1],
							}}
							class="text-xl md:text-2xl text-gray-200"
						>
							Congratulations on your victory!
						</Motion.p>
					</div>
				</Motion.div>
			</Show>
		</Presence>
	);
}
