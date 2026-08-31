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
import { TypeChecks } from "./types/utility"
/*
 * Base class for all errors in Tutanota. Provides the handling of error stacks for chrome (captureStackTrace) and others.
 *
 * Note that passing errors between worker and main thread requires all fields of the error to be serializable.
 * Currently those are name, message, stack and data. See (errorToObj() and objToError()).
 *
 * In order to correctly set the class type of the error after deserialization
 * (needed for e instanceof CustomError to work), the error class needs to be
 * added to the ErrorNameToType map in Utils.js.
 */
@TSwUncheckedSendable({ reasoning: "All fields in TutanotaError are readonly and we dont mutate anything once an error is created" })
export class TutanotaError<T = never | null> extends Error {
	constructor(
		public readonly name: string,
		public readonly message: string,
		/**
		 * Sets the data field of the TutanotaError so we can transport any additional data over the worker <-> main
		 * thread bridge. See (errorToObj() and objToError())
		 * data field is respected by the WorkerProtocol. Other fields might not be passed
		 */
		public readonly data: T,
	) {
		super(message)

		if (TypeChecks.isFunction(Error.captureStackTrace)) {
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

				while (stackLines[0] != null && stackLines[0].match(this.name) == null) {
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

/** @TSwUncheckedSendable TutanotaError is TSUncheckedSendable and ProgrammingError does not introduce any new fields */
export class ProgrammingError extends TutanotaError {
	constructor(m: string | null = null) {
		super("ProgrammingError", m ?? "Unknown programming error", null)
	}
}
