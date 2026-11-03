//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class SseError extends TutanotaError {
	constructor(m: string) {
		super("SseError", m)
	}
}
