//@bundleInto:common-min

import { TutanotaError } from "@tutao/app-env"

export class ServerModelsUnavailableError extends TutanotaError {
	constructor(msg: string) {
		super("ServerModelsUnavailableError", msg)
	}
}
