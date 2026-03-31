//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class KeyPermanentlyInvalidatedError extends TutanotaError {
	constructor(message: string) {
		super("KeyPermanentlyInvalidatedError", message)
	}
}
