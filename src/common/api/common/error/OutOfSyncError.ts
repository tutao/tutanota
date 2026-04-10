//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class OutOfSyncError extends TutanotaError {
	constructor(message: string) {
		super("OutOfSyncError", message)
	}
}
