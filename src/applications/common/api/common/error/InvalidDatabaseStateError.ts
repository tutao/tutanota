//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class InvalidDatabaseStateError extends TutanotaError {
	constructor(message: string) {
		super("InvalidDatabaseStateError", message)
	}
}
