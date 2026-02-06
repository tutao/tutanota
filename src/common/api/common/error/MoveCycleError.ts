import { TutanotaError } from "@tutao/tutanota-error"

export class MoveCycleError extends TutanotaError {
	constructor(message: string) {
		super("MoveCycleError", message)
	}
}
