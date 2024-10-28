//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class UnverifiedRecipientError extends TutanotaError {
	constructor(message: string) {
		super("UnverifiedRecipientError", message)
	}
}
