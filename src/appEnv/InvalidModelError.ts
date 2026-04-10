import { TutanotaError } from "@tutao/appEnv"

export class InvalidModelError extends TutanotaError {
	constructor(message: string) {
		super("InvalidModelError", message)
	}
}
