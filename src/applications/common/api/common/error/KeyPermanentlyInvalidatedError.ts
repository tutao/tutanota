//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class KeyPermanentlyInvalidatedError extends TutanotaError {
	constructor(message: string) {
		super("KeyPermanentlyInvalidatedError", message)
	}
}
