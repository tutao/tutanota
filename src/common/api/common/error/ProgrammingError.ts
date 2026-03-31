//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class ProgrammingError extends TutanotaError {
	constructor(m?: string) {
		super("ProgrammingError", m ?? "Unknown programming error")
	}
}
