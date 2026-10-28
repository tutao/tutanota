//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class RecipientsNotFoundError extends TutanotaError {
	constructor(m: string) {
		super("RecipientsNotFoundError", m)
	}
}
