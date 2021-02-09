// @flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class RecipientsNotFoundError extends TutanotaError {
	constructor(m: string) {
		super("RecipientsNotFoundError", m)
	}

}