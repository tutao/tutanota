//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class SessionKeyNotFoundError extends TutanotaError {
	constructor(message: string) {
		super("SessionKeyNotFoundError", message)
	}
}
