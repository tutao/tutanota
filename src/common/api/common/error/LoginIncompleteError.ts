//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class LoginIncompleteError extends TutanotaError {
	constructor(message: string) {
		super("LoginIncompleteError", message)
	}
}
