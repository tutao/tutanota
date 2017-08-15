import {TutanotaError} from "./TutanotaError"

export class ProgrammingError extends TutanotaError {
	constructor(m) {
		super("ProgrammingError", m)
	}

}