//@flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class InvalidDatabaseStateError extends TutanotaError {
	constructor(message: string) {
		super("InvalidDatabaseStateError", message)
	}
}