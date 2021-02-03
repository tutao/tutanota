// @flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class PermissionError extends TutanotaError {
	constructor(m: string) {
		super("PermissionError", m)
	}

}