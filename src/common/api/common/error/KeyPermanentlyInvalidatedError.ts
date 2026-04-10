//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class KeyPermanentlyInvalidatedError extends TutanotaError {
	constructor(message: string) {
		super("KeyPermanentlyInvalidatedError", message)
	}
}
