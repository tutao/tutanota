import { TutanotaError } from "@tutao/lang-api"

export class InvalidModelError extends TutanotaError {
	constructor(message: string) {
		super("InvalidModelError", message)
	}
}
