//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class ProgrammingError extends TutanotaError {
	constructor(m?: string) {
		super("ProgrammingError", m ?? "Unkown programming error")
	}
}
