//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class RecipientsNotFoundError extends TutanotaError {
	constructor(m: string) {
		super("RecipientsNotFoundError", m)
	}
}
