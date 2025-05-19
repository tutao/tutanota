//@bundleInto:common-min

import { TutanotaError } from "@tutao/tutanota-error"

export class ServerModelsUnavailableError extends TutanotaError {
	constructor(msg: string) {
		super("ServerModelsUnavailableError", msg)
	}
}
