//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class InvalidDatabaseStateError extends TutanotaError {
	constructor(message: string) {
		super("InvalidDatabaseStateError", message)
	}
}
