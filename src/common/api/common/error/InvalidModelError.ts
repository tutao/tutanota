//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class InvalidModelError extends TutanotaError {
	constructor(message: string) {
		super("InvalidModelError", message)
	}
}
