// @flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class RecipientNotResolvedError extends TutanotaError {
	constructor(m: string) {
		super("RecipientNotResolvedError", m)
	}

}