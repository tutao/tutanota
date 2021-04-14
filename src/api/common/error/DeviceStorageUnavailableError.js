// @flow
//@bundleInto:common-min

import {TutanotaError} from "./TutanotaError"

export class DeviceStorageUnavailableError extends TutanotaError {
	constructor(msg: string, error: Error) {
		super("DeviceStorageUnavailableError", error ? (msg + "> " + (error.stack ? error.stack : error.message)) : msg)
	}
}
