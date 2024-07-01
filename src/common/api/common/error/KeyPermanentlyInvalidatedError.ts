//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class KeyPermanentlyInvalidatedError extends TutanotaError {
	constructor(message: string) {
		super("KeyPermanentlyInvalidatedError", message)
	}
}
