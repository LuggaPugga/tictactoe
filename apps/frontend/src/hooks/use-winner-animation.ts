import { createSignal, onCleanup } from "solid-js";

export function useWinnerAnimation(duration = 3000) {
	const [showAnimation, setShowAnimation] = createSignal(false);
	let timeoutId: number | undefined;

	const triggerAnimation = () => {
		setShowAnimation(true);
		timeoutId = window.setTimeout(() => {
			setShowAnimation(false);
		}, duration);
	};

	const cleanup = () => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
	};

	onCleanup(() => {
		cleanup();
	});

	return {
		showAnimation,
		triggerAnimation,
		cleanup,
	};
}
