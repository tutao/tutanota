//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class MalformedQrPayloadError extends TutanotaError {
	constructor(m: string) {
		super("MalformedQrPayloadError", m)
	}
}
