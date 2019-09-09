// @flow
import {TutanotaError} from "./TutanotaError"

export class JsonTypeError extends TutanotaError {
	constructor(m: string) {
		super("JsonTypeError", m)
	}
}
