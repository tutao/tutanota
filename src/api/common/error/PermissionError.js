// @flow
//@bundleInto:common-min
import {TutanotaError} from "./TutanotaError"

export class PermissionError extends TutanotaError {
	constructor(m: string) {
		super("PermissionError", m)
	}

}