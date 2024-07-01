//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class MailBodyTooLargeError extends TutanotaError {
	constructor(message: string) {
		super("MailBodyTooLargeError", message)
	}
}
