//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class OutOfSyncError extends TutanotaError {
	constructor(message: string) {
		super("OutOfSyncError", message)
	}
}
