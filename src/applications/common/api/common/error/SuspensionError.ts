//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"
import { filterInt, Nullable } from "@tutao/utils"

export class SuspensionError extends TutanotaError<Nullable<string>> {
	constructor(
		message: string,
		// milliseconds to wait
		suspensionTime: Nullable<string>,
	) {
		super("SuspensionError", message, suspensionTime)

		if (suspensionTime != null && Number.isNaN(filterInt(suspensionTime))) {
			throw new Error("invalid suspension time value (NaN)")
		}
	}
}
