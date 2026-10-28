//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class RecipientNotResolvedError extends TutanotaError {
	constructor(m: string) {
		super("RecipientNotResolvedError", m)
	}
}
