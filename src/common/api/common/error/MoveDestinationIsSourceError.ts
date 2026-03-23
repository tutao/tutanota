import { TutanotaError } from "@tutao/tutanota-error"

export class MoveDestinationIsSourceError extends TutanotaError {
	constructor(message: string) {
		super("MoveDestinationIsSourceError", message)
	}
}
