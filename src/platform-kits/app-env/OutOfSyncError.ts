//@bundleInto:common-min

import { TutanotaError } from "./index"

export class OutOfSyncError extends TutanotaError {
	constructor(message: string) {
		super("OutOfSyncError", message)
	}
}
