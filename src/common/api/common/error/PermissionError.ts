//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class PermissionError extends TutanotaError {
	constructor(m: string) {
		super("PermissionError", m)
	}
}
