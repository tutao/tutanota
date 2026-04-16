import { TutanotaError } from "@tutao/error"

export class MoveDestinationIsSourceError extends TutanotaError {
	constructor(message: string) {
		super("MoveDestinationIsSourceError", message)
	}
}
