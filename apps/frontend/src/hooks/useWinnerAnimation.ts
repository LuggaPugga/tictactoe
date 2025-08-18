import { useCallback, useRef, useState } from "react";

export function useWinnerAnimation(duration = 3000) {
	const [showAnimation, setShowAnimation] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const triggerAnimation = useCallback(() => {
		setShowAnimation(true);
		setTimeout(() => {
			setShowAnimation(false);
		}, duration);
	}, [duration]);

	const cleanup = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	}, []);

	return {
		showAnimation,
		triggerAnimation,
		cleanup,
	};
}
