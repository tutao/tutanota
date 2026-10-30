import { TutanotaError } from "@tutao/app-env"

export class MoveCycleError extends TutanotaError {
	constructor(message: string) {
		super("MoveCycleError", message)
	}
}
