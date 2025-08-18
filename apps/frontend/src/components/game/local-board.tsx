import { motion } from "framer-motion";
import { Circle, X } from "lucide-react";
import type React from "react";
import type { CellValue, LocalBoard as LocalBoardType } from "@/lib/types";

interface LocalBoardProps {
	board: LocalBoardType;
	boardIndex: number;
	onCellClick: (boardIndex: number, cellIndex: number) => void;
	isActive: boolean;
	winner: string | null;
}

const LocalBoard: React.FC<LocalBoardProps> = ({
	board,
	boardIndex,
	onCellClick,
	isActive,
	winner,
}) => {
	const getCellStyle = (value: CellValue) => {
		let style =
			"w-full h-full flex items-center justify-center transition-colors duration-200 p-2 ";

		if (value === "X") {
			style += "text-blue-600 dark:text-blue-400";
		} else if (value === "O") {
			style += "text-red-600 dark:text-red-400";
		} else {
			style +=
				isActive && !winner
					? "hover:bg-gray-100/5 dark:hover:bg-gray-100/5 cursor-pointer"
					: "cursor-not-allowed";
		}
		return style;
	};

	return (
		<div className="aspect-square overflow-hidden relative">
			<div className="w-full h-full relative">
				<svg
					className="absolute inset-0 w-full h-full"
					viewBox="0 0 100 100"
					preserveAspectRatio="none"
				>
					<title>Grid lines</title>
					<path
						d="M33.33 0 L33.33 100"
						stroke="currentColor"
						strokeWidth="0.5"
						fill="none"
						className="text-gray-400/50 dark:text-gray-400/30"
					/>
					<path
						d="M66.67 0 L66.67 100"
						stroke="currentColor"
						strokeWidth="0.5"
						fill="none"
						className="text-gray-400/50 dark:text-gray-400/30"
					/>
					<path
						d="M0 33.33 L100 33.33"
						stroke="currentColor"
						strokeWidth="0.5"
						fill="none"
						className="text-gray-400/50 dark:text-gray-400/30"
					/>
					<path
						d="M0 66.67 L100 66.67"
						stroke="currentColor"
						strokeWidth="0.5"
						fill="none"
						className="text-gray-400/50 dark:text-gray-400/30"
					/>
				</svg>
				<div className="grid grid-cols-3 h-full w-full relative z-20">
					{board.map((cell, cellIndex) => (
						<button
							type="button"
							key={`${boardIndex}-${
								// biome-ignore lint/suspicious/noArrayIndexKey: <cellIndex is unique and matches the cell value>
								cellIndex
							}`}
							className={`${getCellStyle(cell)} aspect-square`}
							onClick={() => isActive && onCellClick(boardIndex, cellIndex)}
							disabled={!isActive || cell !== null}
						>
							{cell && !winner ? (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ type: "spring", stiffness: 300, damping: 20 }}
									className="w-full h-full flex items-center justify-center"
								>
									{cell === "X" ? (
										<X className="w-12 h-12" />
									) : (
										<Circle className="w-10 h-10" />
									)}
								</motion.div>
							) : (
								<span className="sr-only">Empty cell</span>
							)}
						</button>
					))}
				</div>
			</div>
			{winner && (
				<div
					className={`absolute inset-0 flex items-center justify-center ${
						winner === "X"
							? "text-blue-600 dark:text-blue-400"
							: "text-red-600 dark:text-red-400"
					}`}
				>
					{winner === "X" ? (
						<X className="w-4/5 h-4/5" />
					) : (
						<Circle className="w-4/6 h-4/6" />
					)}
				</div>
			)}
		</div>
	);
};

export default LocalBoard;
