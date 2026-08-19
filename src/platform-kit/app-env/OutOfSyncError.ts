//@bundleInto:common-min

import { TutanotaError } from "@tutao/lang-api"

export class OutOfSyncError extends TutanotaError {
	constructor(message: string) {
		super("OutOfSyncError", message)
	}
}
