//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class MailBodyTooLargeError extends TutanotaError {
	constructor(message: string) {
		super("MailBodyTooLargeError", message)
	}
}
