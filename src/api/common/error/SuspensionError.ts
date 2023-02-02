//@bundleInto:common-min

import { TutanotaError } from "./TutanotaError.js"

export class SuspensionError extends TutanotaError {
	suspensionTime?: string | null

	constructor(message: string, suspensionTime?: string | null) {
		super("SuspensionError", message)
	}
}
