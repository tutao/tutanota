//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"
import { filterInt } from "@tutao/utils"

export class SuspensionError extends TutanotaError {
	// milliseconds to wait
	readonly data: string | null
	constructor(message: string, suspensionTime: string | null) {
		super("SuspensionError", message)

		if (suspensionTime != null && Number.isNaN(filterInt(suspensionTime))) {
			throw new Error("invalid suspension time value (NaN)")
		}

		this.data = suspensionTime
	}
}
