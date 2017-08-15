import {TutanotaError} from "./TutanotaError"

export class OutOfSyncError extends TutanotaError {
	constructor() {
		super("OutOfSyncError", "")
	}

}