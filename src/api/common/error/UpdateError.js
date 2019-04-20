// @flow
import {TutanotaError} from "./TutanotaError"

export class UpdateError extends TutanotaError {
	constructor(m: string) {
		super("UpdateError", m)
	}

}
