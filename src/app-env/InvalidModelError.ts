import { TutanotaError } from "./TutanotaError.js"

export class InvalidModelError extends TutanotaError {
	constructor(message: string) {
		super("InvalidModelError", message)
	}
}
