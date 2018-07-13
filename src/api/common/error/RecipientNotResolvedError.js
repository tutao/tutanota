import {TutanotaError} from "./TutanotaError"

export class RecipientNotResolvedError extends TutanotaError {
	constructor(m) {
		super("RecipientNotResolvedError", m)
	}

}