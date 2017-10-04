// @flow
import {TutanotaError} from "./TutanotaError"

export class SessionKeyNotFoundError extends TutanotaError {

	constructor(message: string) {
		super("SessionKeyNotFoundError", message)
	}

}