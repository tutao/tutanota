//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class PermissionError extends TutanotaError {
	constructor(m: string) {
		super("PermissionError", m)
	}
}
