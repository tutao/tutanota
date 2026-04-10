//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class OfflineDbClosedError extends TutanotaError {
	constructor(msg?: string) {
		super("OfflineDbClosedError", msg ?? "Offline db is closed")
	}
}
