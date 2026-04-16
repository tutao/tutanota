//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class LoginIncompleteError extends TutanotaError {
	constructor(message: string) {
		super("LoginIncompleteError", message)
	}
}
