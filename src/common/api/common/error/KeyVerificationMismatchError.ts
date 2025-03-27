//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class KeyVerificationMismatchError extends TutanotaError {
	data: ReadonlyArray<string>

	constructor(message: string) {
		super("KeyVerificationMismatchError", message)
		this.data = []
	}

	/**
	 * Sets the data field of the TutanotaError so we can transport the recipient mail addresses over the worker <-> main
	 * thread bridge. See (errorToObj() and objToError()).
	 * @param recipientMailAddresses
	 */
	setData(recipientMailAddresses: ReadonlyArray<string>): KeyVerificationMismatchError {
		this.data = recipientMailAddresses
		return this
	}
}
