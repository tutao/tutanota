//@flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class InvalidDatabaseStateError extends TutanotaError {
	constructor(message: string) {
		super("InvalidDatabaseStateError", message)
	}
}