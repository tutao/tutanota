// @flow
//@bundleInto:common-min

import {TutanotaError} from "./TutanotaError"

export class MailBodyTooLargeError extends TutanotaError {
	constructor(message: string) {
		super("MailBodyTooLargeError", message)
	}
}