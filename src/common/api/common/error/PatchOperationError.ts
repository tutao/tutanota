//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class PatchOperationError extends TutanotaError {
	constructor(m: string) {
		super("PatchOperationError", m)
	}
}
