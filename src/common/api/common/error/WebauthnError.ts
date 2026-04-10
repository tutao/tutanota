//@bundleInto:common-min

import { TutanotaError } from "@tutao/appEnv"

export class WebauthnError extends TutanotaError {
	constructor(error: Error) {
		super("WebauthnError", `${error.name} ${String(error)}`)
	}
}
