//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

//Error cannot be serialized to be passed between worker and main thread
export class SetupMultipleError<T> extends TutanotaError {
	errors: Error[]
	failedInstances: Array<T>

	constructor(message: string, errors: Error[], instances: Array<T>) {
		super(
			"SetupMultipleError",
			`${message}
Number of errors: ${errors.length}
First error: ${errors[0]}`,
		)
		this.errors = errors
		this.failedInstances = instances
	}
}
