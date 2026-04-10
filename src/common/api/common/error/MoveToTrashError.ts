import { TutanotaError } from "@tutao/appEnv"

export class MoveToTrashError extends TutanotaError {
	constructor(message: string) {
		super("MoveToTrashError", message)
	}
}
