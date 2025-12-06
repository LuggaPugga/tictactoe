import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ContinueGameDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onContinue: () => void;
	onNewGame: () => void;
}

export function ContinueGameDialog(props: ContinueGameDialogProps) {
	return (
		<Dialog open={props.isOpen} onOpenChange={props.onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Continue Previous Game?</DialogTitle>
					<DialogDescription>
						A previous game was found. Would you like to continue it or start a
						new game?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={props.onNewGame} variant="outline">
						New Game
					</Button>
					<Button
						onClick={props.onContinue}
						class="bg-[#c1644d] hover:bg-[#b15a44] dark:bg-[#e07a5f] dark:hover:bg-[#d0694e]"
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
