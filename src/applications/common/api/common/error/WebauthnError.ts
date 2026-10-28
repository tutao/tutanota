//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class WebauthnError extends TutanotaError {
	constructor(error: Error) {
		super("WebauthnError", `${error.name} ${String(error)}`)
	}
}
