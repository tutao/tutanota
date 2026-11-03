//@bundleInto:common-min

import { filterInt, Nullable } from "@tutao/utils"
import { HttpClientError } from "@tutao/http-client/error"

export class SuspensionError extends HttpClientError {
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
