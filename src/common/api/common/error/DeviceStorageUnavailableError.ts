//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

/**
 * this error is thrown when the client fails to get access to a safe storage for
 * credentials, pushIdentifiers and alarms.
 */
export class DeviceStorageUnavailableError extends TutanotaError {
	constructor(msg: string, error: Error | null) {
		const message = error ? msg + "> " + (error.stack ? error.stack : error.message) : msg
		super("DeviceStorageUnavailableError", message)
	}
}
