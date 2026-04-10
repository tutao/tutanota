//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class SseError extends TutanotaError {
	constructor(m: string) {
		super("SseError", m)
	}
}
