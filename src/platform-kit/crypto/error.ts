/**
 * @fileoverview An entry point for the errors from this package.
 * Needed in case we only want to handle the errors but don't want to include the rest of the code.
 */

import { TutanotaError } from "@tutao/app-env"
import { isNotNull, Nullable } from "@tutao/utils"

export class CryptoError extends TutanotaError {
	constructor(message: string, error: Nullable<Error> = null) {
		super("CryptoError", isNotNull(error) ? message + "> " + (error.stack ?? error.message) : message)
	}
}

export class SessionKeyNotFoundError extends TutanotaError {
	constructor(message: string) {
		super("SessionKeyNotFoundError", message)
	}
}
