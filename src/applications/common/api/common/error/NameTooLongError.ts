import { TutanotaError } from "@tutao/app-env"

export class NameTooLongError extends TutanotaError {
	constructor(message: string) {
		super("NameTooLongError", message)
	}
}
