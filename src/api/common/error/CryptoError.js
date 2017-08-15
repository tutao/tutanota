// @flow
import {TutanotaError} from "./TutanotaError"

export class CryptoError extends TutanotaError {
	/**
	 * A crypto exception is thrown whenever an encryption/decryption or conversion of keys fails.
	 * @param message An information about the exception.
	 * @param error The original error that was thrown.
	 */
	constructor(message: string, error: ?Error) {
		super("CryptoError", error ? message + "> " + (error.stack ? error.stack : error.message) : message)
	}

}