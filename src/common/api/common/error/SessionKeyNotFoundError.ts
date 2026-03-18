//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class SessionKeyNotFoundError extends TutanotaError {
	constructor(message: string) {
		super("SessionKeyNotFoundError", message)
	}
}
