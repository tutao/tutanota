//@flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class ProgrammingError extends TutanotaError {
	constructor(m: string) {
		super("ProgrammingError", m)
	}
}