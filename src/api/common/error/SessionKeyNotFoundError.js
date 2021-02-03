// @flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class SessionKeyNotFoundError extends TutanotaError {

	constructor(message: string) {
		super("SessionKeyNotFoundError", message)
	}

}