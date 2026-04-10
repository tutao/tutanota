//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class RecipientNotResolvedError extends TutanotaError {
	constructor(m: string) {
		super("RecipientNotResolvedError", m)
	}
}
