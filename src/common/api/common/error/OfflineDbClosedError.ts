//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class OfflineDbClosedError extends TutanotaError {
	constructor(msg?: string) {
		super("OfflineDbClosedError", msg ?? "Offline db is closed")
	}
}
