//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class SseError extends TutanotaError {
	constructor(m: string) {
		super("SseError", m)
	}
}
