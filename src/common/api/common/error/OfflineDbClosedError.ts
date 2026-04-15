//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class OfflineDbClosedError extends TutanotaError {
	constructor(msg?: string) {
		super("OfflineDbClosedError", msg ?? "Offline db is closed")
	}
}
