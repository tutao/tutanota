//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export abstract class DbError extends TutanotaError {
	public readonly error: Error | null

	/**
	 * A db error is thrown from indexeddb
	 * @param name
	 * @param message An information about the exception.
	 * @param error The original error that was thrown.
	 */
	protected constructor(name: string, message: string, error?: Error) {
		super(name, error ? message + `: ${error.name}, ${error.message}> ` + (error.stack ? error.stack : error.message) : message)
		this.error = error ?? null
	}
}

export class GenericDbError extends DbError {
	public constructor(message: string, error?: Error) {
		super("GenericDbError", message, error)
	}
}
