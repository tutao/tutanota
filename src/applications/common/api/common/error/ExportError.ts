//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import { TutanotaErrorWithData } from "@tutao/lang-api"

export const enum ExportErrorReason {
	LockedForUser = "LockedForUser",
	RunningForUser = "RunningForUser",
}

export class ExportError extends TutanotaError implements TutanotaErrorWithData<ExportErrorReason> {
	// data field is respected by the WorkerProtocol. Other fields might not be passed
	constructor(
		msg: string,
		public data: Readonly<ExportErrorReason>,
	) {
		super("ExportError", msg)
	}
}
