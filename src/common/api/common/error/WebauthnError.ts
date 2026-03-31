//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class WebauthnError extends TutanotaError {
	constructor(error: Error) {
		super("WebauthnError", `${error.name} ${String(error)}`)
	}
}
