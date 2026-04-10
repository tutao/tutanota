import { TutanotaError } from "@tutao/appEnv"

export class MoveDestinationIsSourceError extends TutanotaError {
	constructor(message: string) {
		super("MoveDestinationIsSourceError", message)
	}
}
