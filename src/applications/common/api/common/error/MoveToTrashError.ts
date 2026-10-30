import { TutanotaError } from "@tutao/app-env"

export class MoveToTrashError extends TutanotaError {
	constructor(message: string) {
		super("MoveToTrashError", message)
	}
}
