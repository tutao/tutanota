import { TutanotaError } from "@tutao/error"

export class MoveToTrashError extends TutanotaError {
	constructor(message: string) {
		super("MoveToTrashError", message)
	}
}
