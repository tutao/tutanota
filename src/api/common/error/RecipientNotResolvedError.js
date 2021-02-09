// @flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class RecipientNotResolvedError extends TutanotaError {
	constructor(m: string) {
		super("RecipientNotResolvedError", m)
	}

}