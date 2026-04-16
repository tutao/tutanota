//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class ParsingError extends TutanotaError {
	constructor(m: string) {
		super("ParsingError", m)
	}
}
