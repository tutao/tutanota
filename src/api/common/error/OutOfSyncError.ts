//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class OutOfSyncError extends TutanotaError {
	constructor(message: string) {
		super("OutOfSyncError", message)
	}
}
