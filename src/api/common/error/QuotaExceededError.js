//@flow

import {DbError} from "./DbError"

//assertMainOrNodeBoot()

/**
 * Error used to indicate that there's insufficient space on the device.
 */
export class QuotaExceededError extends DbError {
	constructor(message: string, error: ?Error) {
		super(message, error)
		this.name = "QuotaExceededError"
	}
}