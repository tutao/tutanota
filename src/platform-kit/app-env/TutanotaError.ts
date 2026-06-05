/**
 * Base class for all errors in Tutanota. Provides the handling of error stacks for chrome (captureStackTrace) and others.
 *
 * Note that passing errors between worker and main thread requires all fields of the error to be serializable.
 * Currently those are name, message, stack and data. See (errorToObj() and objToError()).
 *
 * In order to correctly set the class type of the error after deserialization
 * (needed for e instanceof CustomError to work), the error class needs to be
 * added to the ErrorNameToType map in Utils.js.
 */

export class TutanotaError extends Error {
	name: string
	message: string

	constructor(name: string, message: string) {
		super(message)
		this.name = name
		this.message = message

		if (typeof Error.captureStackTrace === "function") {
			Error.captureStackTrace(this, this.constructor)
		} else {
			let error = new Error()

			if (error.stack == null) {
				// fill the stack trace on ios devices
				try {
					throw error
				} catch (e) {
					/* empty */
				}
			}

			this.stack = this.name + ". " + this.message

			if (error.stack != null) {
				// not existing in IE9
				let stackLines = error.stack.split("\n")

				while (stackLines[0] != null && !stackLines[0].match(this.name)) {
					stackLines = stackLines.slice(1) // removes line from stack
				}

				if (stackLines.length === 0) {
					this.stack = error.stack
				} else {
					this.stack += "\n" + stackLines.join("\n")
				}
			}
		}
	}
}
