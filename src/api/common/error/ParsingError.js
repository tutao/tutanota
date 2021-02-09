// @flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class ParsingError extends TutanotaError {
	constructor(m: string) {
		super("ParsingError", m)
	}
}