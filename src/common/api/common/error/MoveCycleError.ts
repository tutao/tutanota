import { TutanotaError } from "@tutao/error"

export class MoveCycleError extends TutanotaError {
	constructor(message: string) {
		super("MoveCycleError", message)
	}
}
