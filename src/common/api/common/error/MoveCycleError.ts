import { TutanotaError } from "@tutao/appEnv"

export class MoveCycleError extends TutanotaError {
	constructor(message: string) {
		super("MoveCycleError", message)
	}
}
