//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class MalformedQrPayloadError extends TutanotaError {
	constructor(m: string) {
		super("MalformedQrPayloadError", m)
	}
}
