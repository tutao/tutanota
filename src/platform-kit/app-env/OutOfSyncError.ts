//@bundleInto:common-min

import { TsString, TutanotaError } from "@tutao/lang-api"

export class OutOfSyncError extends TutanotaError {
	constructor(message: TsString) {
		super("OutOfSyncError", message)
	}
}
