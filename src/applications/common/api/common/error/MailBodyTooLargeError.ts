//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class MailBodyTooLargeError extends TutanotaError {
	constructor(message: string) {
		super("MailBodyTooLargeError", message)
	}
}
