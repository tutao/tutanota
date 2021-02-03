// @flow
import {TutanotaError} from "./TutanotaError"

//assertMainOrNodeBoot()

export class SseError extends TutanotaError {
	constructor(m: string) {
		super("SseError", m)
	}

}