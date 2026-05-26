//@bundleInto:common-min

import { TutanotaError } from "../../../../../platform-kits/app-env"

export class MalformedQrPayloadError extends TutanotaError {
	constructor(m: string) {
		super("MalformedQrPayloadError", m)
	}
}
