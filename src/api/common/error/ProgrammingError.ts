//@flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class ProgrammingError extends TutanotaError {
	constructor(m: string) {
		super("ProgrammingError", m)
	}
}