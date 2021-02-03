// @flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class ParsingError extends TutanotaError {
	constructor(m: string) {
		super("ParsingError", m)
	}
}