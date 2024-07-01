//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class RecipientsNotFoundError extends TutanotaError {
	constructor(m: string) {
		super("RecipientsNotFoundError", m)
	}
}
