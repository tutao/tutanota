// @flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class RecipientsNotFoundError extends TutanotaError {
	constructor(m: string) {
		super("RecipientsNotFoundError", m)
	}

}