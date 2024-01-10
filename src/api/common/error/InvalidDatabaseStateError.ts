//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class InvalidDatabaseStateError extends TutanotaError {
	constructor(message: string) {
		super("InvalidDatabaseStateError", message)
	}
}
