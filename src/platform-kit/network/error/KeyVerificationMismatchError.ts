//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class KeyVerificationMismatchError extends TutanotaError<ReadonlyArray<string>> {
	constructor(message: string, recipientMailAddresses: ReadonlyArray<string> = []) {
		super("KeyVerificationMismatchError", message, recipientMailAddresses)
	}
}
