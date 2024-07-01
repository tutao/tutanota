//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class DbError extends TutanotaError {
	error: Error | null

	/**
	 * A db error is thrown from indexeddb
	 * @param message An information about the exception.
	 * @param error The original error that was thrown.
	 */
	constructor(message: string, error?: Error) {
		super("DbError", error ? message + `: ${error.name}, ${error.message}> ` + (error.stack ? error.stack : error.message) : message)
		this.error = error ?? null
	}
}
