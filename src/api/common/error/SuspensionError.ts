//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class SuspensionError extends TutanotaError {
	constructor(message: string) {
		super("SuspensionError", message)
	}
}
