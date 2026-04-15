//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class ProgrammingError extends TutanotaError {
	constructor(m?: string) {
		super("ProgrammingError", m ?? "Unknown programming error")
	}
}
