//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class DbError extends TutanotaError {
	error: Error | null

	/**
	 * A db error is thrown from indexeddb
	 * @param message An information about the exception.
	 * @param error The original error that was thrown.
	 * @param name Name to use for this error instance
	 */
	constructor(message: string, error?: Error, name: string = "DbError") {
		super(name, error ? message + `: ${error.name}, ${error.message}> ` + (error.stack ? error.stack : error.message) : message, null)
		this.error = error ?? null
	}
}
