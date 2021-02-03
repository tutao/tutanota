// @flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class OutOfSyncError extends TutanotaError {
	constructor() {
		super("OutOfSyncError", "")
	}

}