//@bundleInto:common-min

import { TutanotaError } from "./TutanotaError"

export class LoginIncompleteError extends TutanotaError {
	constructor(message: string) {
		super("LoginIncompleteError", message)
	}
}
