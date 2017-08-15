import {TutanotaError} from "./TutanotaError"

export class UserError extends TutanotaError {
	constructor(m) {
		super("UserError", m)
	}

}