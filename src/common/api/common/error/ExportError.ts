//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export const enum ExportErrorReason {
	LockedForUser = "LockedForUser",
	RunningForUser = "RunningForUser",
}

export class ExportError extends TutanotaError {
	// data field is respected by the WorkerProtocol. Other fields might not be passed
	constructor(msg: string, readonly data: ExportErrorReason) {
		super("ExportError", msg)
	}
}
