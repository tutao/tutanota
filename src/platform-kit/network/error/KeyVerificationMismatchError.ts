//@bundleInto:common-min

import { TutanotaError, TutanotaErrorWithData } from "@tutao/lang-api"

export class KeyVerificationMismatchError extends TutanotaError implements TutanotaErrorWithData<Array<string>> {
	public readonly data: Readonly<Array<string>>
	constructor(message: string, recipientMailAddresses: ReadonlyArray<string> = []) {
		super("KeyVerificationMismatchError", message)
		this.data = recipientMailAddresses
	}
}
