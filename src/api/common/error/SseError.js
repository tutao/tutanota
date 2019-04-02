// @flow
import {TutanotaError} from "./TutanotaError"

export class SseError extends TutanotaError {
	constructor(m: string) {
		super("SseError", m)
	}

}