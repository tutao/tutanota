//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class RecipientNotResolvedError extends TutanotaError {
	constructor(m: string) {
		super("RecipientNotResolvedError", m)
	}
}
