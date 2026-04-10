//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class InvalidDatabaseStateError extends TutanotaError {
	constructor(message: string) {
		super("InvalidDatabaseStateError", message)
	}
}
