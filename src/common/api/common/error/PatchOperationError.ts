//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class PatchOperationError extends TutanotaError {
	constructor(m: string) {
		super("PatchOperationError", m)
	}
}
