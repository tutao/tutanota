//@bundleInto:common-min

import {TutanotaError} from "./TutanotaError"

//Error cannot be serialized to be passed between worker and main thread
export class SetupMultipleError<T> extends TutanotaError {
	errors: Error[]
	failedInstances: Array<T>

	constructor(message: string, errors: Error[], instances: Array<T>) {
		super("SetupMultipleError", message + "\nNumber of errors: " + errors.length)
		this.errors = errors
		this.failedInstances = instances
	}
}