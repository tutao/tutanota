//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class PermissionError extends TutanotaError {
	constructor(m: string) {
		super("PermissionError", m)
	}
}
