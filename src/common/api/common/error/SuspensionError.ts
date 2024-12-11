//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"
import { filterInt } from "@tutao/tutanota-utils"

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
