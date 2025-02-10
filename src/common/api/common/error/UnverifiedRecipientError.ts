//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class UnverifiedRecipientError extends TutanotaError {
	readonly recipientMailAddress: string

	constructor(recipientMailAddress: string) {
		super("UnverifiedRecipientError", recipientMailAddress)
		this.recipientMailAddress = recipientMailAddress
	}
}
