import {TutanotaError} from "./TutanotaError"

export class PermissionError extends TutanotaError {
	constructor(m) {
		super("PermissionError", m)
	}

}