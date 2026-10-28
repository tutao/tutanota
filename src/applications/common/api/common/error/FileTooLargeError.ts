import { TutanotaError } from "@tutao/app-env"

export class FileTooLargeError extends TutanotaError {
	constructor(message: string) {
		super("FileTooLargeError", message)
	}
}
