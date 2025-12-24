//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class InvalidModelError extends TutanotaError {
	constructor(message: string) {
		super("InvalidModelError", message)
	}
}
