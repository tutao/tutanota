import { TutanotaError } from "@tutao/tutanota-error"

export class MoveToTrashError extends TutanotaError {
	constructor(message: string) {
		super("MoveToTrashError", message)
	}
}
