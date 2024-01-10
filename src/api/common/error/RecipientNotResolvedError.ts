//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class RecipientNotResolvedError extends TutanotaError {
	constructor(m: string) {
		super("RecipientNotResolvedError", m)
	}
}
