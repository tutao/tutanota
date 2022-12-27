//@bundleInto:common-min

import { TutanotaError } from "./TutanotaError.js"

export class SuspensionError extends TutanotaError {
	constructor(message: string) {
		super("SuspensionError", message)
	}
}
