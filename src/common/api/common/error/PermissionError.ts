//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class PermissionError extends TutanotaError {
	constructor(m: string) {
		super("PermissionError", m)
	}
}
