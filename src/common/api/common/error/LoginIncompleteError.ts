//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class LoginIncompleteError extends TutanotaError {
	constructor(message: string) {
		super("LoginIncompleteError", message)
	}
}
