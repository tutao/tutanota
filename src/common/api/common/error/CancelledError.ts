//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class CancelledError extends TutanotaError {
	/**
	 * A cancelled error is thrown when a async action is aborted
	 * @param message An information about the exception.
	 * @param error The original error that was thrown.
	 */
	constructor(message: string) {
		super("CancelledError", message)
	}
}
