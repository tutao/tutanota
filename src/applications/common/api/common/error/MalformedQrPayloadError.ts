//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class MalformedQrPayloadError extends TutanotaError {
	constructor(m: string) {
		super("MalformedQrPayloadError", m)
	}
}
