//@bundleInto:common-min

import {TutanotaError} from "./TutanotaError.js"

export class OfflineDbClosedError extends TutanotaError {

	constructor(msg?: string) {
		super("OfflineDbClosedError", msg ?? "Offline db is closed")
	}
}