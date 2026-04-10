//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class RecipientsNotFoundError extends TutanotaError {
	constructor(m: string) {
		super("RecipientsNotFoundError", m)
	}
}
