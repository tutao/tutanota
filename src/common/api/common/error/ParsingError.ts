//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class ParsingError extends TutanotaError {
	constructor(m: string) {
		super("ParsingError", m)
	}
}
