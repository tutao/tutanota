/**
 * @fileoverview An entry point for the errors from this package.
 * Needed in case we only want to handle the errors but don't want to include the rest of the code.
 */

import { TutanotaError } from "@tutao/app-env"

export class CryptoError extends TutanotaError {
	constructor(message: string, error?: Error) {
		super("CryptoError", error ? message + "> " + (error.stack ? error.stack : error.message) : message)
	}
}

export class SessionKeyNotFoundError extends TutanotaError {
	constructor(message: string) {
		super("SessionKeyNotFoundError", message)
	}
}
