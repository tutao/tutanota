//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class ParsingError extends TutanotaError {
	constructor(m: string) {
		super("ParsingError", m)
	}
}
