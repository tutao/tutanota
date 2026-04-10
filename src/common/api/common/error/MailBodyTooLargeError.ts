//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class MailBodyTooLargeError extends TutanotaError {
	constructor(message: string) {
		super("MailBodyTooLargeError", message)
	}
}
