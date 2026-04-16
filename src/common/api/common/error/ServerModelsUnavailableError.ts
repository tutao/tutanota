//@bundleInto:common-min

import { TutanotaError } from "@tutao/error"

export class ServerModelsUnavailableError extends TutanotaError {
	constructor(msg: string) {
		super("ServerModelsUnavailableError", msg)
	}
}
