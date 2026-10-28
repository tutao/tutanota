import { TutanotaError } from "@tutao/app-env"

export class MoveDestinationIsSourceError extends TutanotaError {
	constructor(message: string) {
		super("MoveDestinationIsSourceError", message)
	}
}
