import {TutanotaError} from "./TutanotaError"

export class RecipientsNotFoundError extends TutanotaError {
	constructor(m) {
		super("RecipientsNotFoundError", m)
	}

}